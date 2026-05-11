import { Router } from "express";
import { updateOrder, getAllOrders } from "../store";

const router = Router();
const KPAY_URL = "https://admin.kpay.site/api/v1/payments/init";

function formatPhone(tel: string): string {
  let phone = tel.replace(/[\s\-().+]/g, "");
  if (phone.startsWith("00237")) phone = phone.slice(2);
  if (phone.startsWith("0")) phone = "237" + phone.slice(1);
  if (!phone.startsWith("237")) phone = "237" + phone;
  return phone;
}

/** Extrait l'orderId depuis externalId "ORDER-{id}" */
function parseOrderId(externalId: string): string | null {
  const match = externalId?.match(/^ORDER-(.+)$/);
  return match ? match[1] : null;
}

// ─── POST /api/payments/initiate ───────────────────────────────────────────────
router.post("/initiate", async (req, res) => {
  const { telephone, amount, method, orderId, userName, userEmail } = req.body;

  if (!telephone || !amount || !method) {
    res.status(400).json({ error: "Données manquantes (telephone, amount, method)" });
    return;
  }

  const phoneNumber = formatPhone(String(telephone));
  const externalId = orderId ? `ORDER-${orderId}` : `mkt_${Date.now()}`;
  const label = method === "momo" ? "MTN MoMo" : "Orange Money";

  try {
    const kpayRes = await fetch(KPAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": process.env.KPAY_API_KEY ?? "",
        "X-Secret-Key": process.env.KPAY_SECRET_KEY ?? "",
      },
      body: JSON.stringify({
        amount: Number(amount),
        phoneNumber,
        externalId,
        description: `Commande Makit+ via ${label}`,
        customerEmail: userEmail ?? "client@makit.cm",
        customerName: userName ?? "Client Makit+",
        metadata: { orderId: orderId ?? "", method },
      }),
    });

    const data = await kpayRes.json() as any;
    req.log.info({ data, phoneNumber, amount, method }, "KPay initiate response");

    if (!kpayRes.ok) {
      res.status(400).json({
        error: data.message ?? data.error ?? "Paiement refusé par l'opérateur",
      });
      return;
    }

    res.json({
      success: true,
      id: data.id ?? null,
      reference: data.reference ?? null,
      providerReference: data.providerReference ?? null,
      status: data.status ?? "PENDING",
      externalId,
      message: data.message ?? "Demande de paiement envoyée. Confirmez sur votre téléphone.",
    });
  } catch (err) {
    req.log.error({ err }, "KPay API error");
    res.status(500).json({ error: "Service de paiement temporairement indisponible" });
  }
});

// ─── POST /api/payments/webhook  (+ /callback pour rétrocompat) ────────────────
async function handleWebhook(req: any, res: any) {
  // Répondre 200 immédiatement — KPay exige une réponse dans les 5s
  res.status(200).json({ received: true });

  const { event, paymentId, status, amount, externalId } = req.body ?? {};
  req.log.info({ event, paymentId, status, amount, externalId }, "KPay webhook received");

  try {
    switch (event) {
      case "payment.completed": {
        // Paiement validé → passer la commande en "achat_en_cours"
        const orderId = parseOrderId(externalId);
        if (orderId) {
          const updated = await updateOrder(orderId, { statut: "achat_en_cours" });
          req.log.info({ orderId, updated: !!updated }, "Order marked achat_en_cours after KPay payment.completed");
        } else {
          req.log.warn({ externalId }, "KPay payment.completed — could not parse orderId");
        }
        break;
      }

      case "payment.failed":
      case "payment.cancelled": {
        // Paiement échoué/annulé → remettre la commande en "en_attente"
        const orderId = parseOrderId(externalId);
        if (orderId) {
          await updateOrder(orderId, { statut: "en_attente" });
          req.log.info({ orderId, event }, "Order reset to en_attente after KPay payment failure");
        }
        break;
      }

      case "withdrawal.completed":
      case "withdrawal.failed":
        // Événements de retrait — aucune action sur les commandes
        req.log.info({ event, paymentId }, "KPay withdrawal event received");
        break;

      default:
        req.log.info({ event }, "KPay unknown event — ignored");
    }
  } catch (err) {
    req.log.error({ err, event, externalId }, "Error processing KPay webhook");
  }
}

router.post("/webhook", handleWebhook);
router.post("/callback", handleWebhook);

// ─── GET /api/payments/callback — redirection navigateur après paiement ────────
router.get("/callback", (_req, res) => {
  res.redirect("https://market-fresh-delivery--makit4079.replit.app/landing/");
});

export default router;
