import { Router, type Request, type Response } from "express";
import { updateOrder } from "../store";
import { createHmac } from "crypto";

const router = Router();

// demo.campay.net = compte de test | campay.net = compte live approuvé
const CAMPAY_BASE = process.env.CAMPAY_ENV === "live"
  ? "https://campay.net/api"
  : "https://demo.campay.net/api";

function formatPhone(tel: string): string {
  let phone = tel.replace(/[\s\-().+]/g, "");
  if (phone.startsWith("00237")) phone = phone.slice(2);
  if (phone.startsWith("0")) phone = "237" + phone.slice(1);
  if (!phone.startsWith("237")) phone = "237" + phone;
  return phone;
}

function parseOrderId(externalRef: string): string | null {
  const match = externalRef?.match(/^ORDER-(.+)$/);
  return match ? match[1] : null;
}

function campayHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Token ${process.env.CAMPAY_TOKEN ?? ""}`,
  };
}

// ─── POST /api/payments/initiate ───────────────────────────────────────────────
router.post("/initiate", async (req: Request, res: Response) => {
  const { telephone, amount, method, orderId, userName } = req.body;

  if (!telephone || !amount) {
    res.status(400).json({ error: "Données manquantes (telephone, amount)" });
    return;
  }

  const from = formatPhone(String(telephone));
  const externalReference = orderId ? `ORDER-${orderId}` : `mkt_${Date.now()}`;
  const label = method === "momo" ? "MTN MoMo" : "Orange Money";

  try {
    const campayRes = await fetch(`${CAMPAY_BASE}/collect/`, {
      method: "POST",
      headers: campayHeaders(),
      body: JSON.stringify({
        amount: String(Number(amount)),
        currency: "XAF",
        from,
        description: `Commande Makit+ via ${label} — ${userName ?? "Client"}`,
        external_reference: externalReference,
      }),
    });

    const data = await campayRes.json() as any;
    req.log.info({ data, from, amount, method }, "Campay collect response");

    if (!campayRes.ok || data.status === "FAILED") {
      res.status(400).json({
        error: data.message ?? data.detail ?? "Paiement refusé par l'opérateur",
      });
      return;
    }

    res.json({
      success: true,
      reference: data.reference ?? null,
      operator: data.operator ?? null,
      ussdCode: data.ussd_code ?? null,
      externalReference,
      message: "Demande de paiement envoyée. Confirmez sur votre téléphone.",
    });
  } catch (err) {
    req.log.error({ err }, "Campay API error");
    res.status(500).json({ error: "Service de paiement temporairement indisponible" });
  }
});

// ─── GET /api/payments/status/:reference ──────────────────────────────────────
router.get("/status/:reference", async (req: Request, res: Response) => {
  const { reference } = req.params;
  try {
    const campayRes = await fetch(`${CAMPAY_BASE}/transaction/${reference}/`, {
      headers: campayHeaders(),
    });
    const data = await campayRes.json() as any;
    req.log.info({ data, reference }, "Campay status check");
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "Campay status check error");
    res.status(500).json({ error: "Impossible de vérifier le statut du paiement" });
  }
});

// ─── POST /api/payments/webhook  (+ /callback rétrocompat) ────────────────────
async function handleWebhook(req: Request, res: Response) {
  // Répondre 200 immédiatement
  res.status(200).json({ received: true });

  // Vérifier la signature Campay si présente
  const signature = req.headers["x-campay-signature"] as string | undefined;
  if (signature && process.env.CAMPAY_WEBHOOK_KEY) {
    const expected = createHmac("sha256", process.env.CAMPAY_WEBHOOK_KEY)
      .update(JSON.stringify(req.body))
      .digest("hex");
    if (signature !== expected) {
      req.log.warn({ signature }, "Campay webhook signature invalide");
      return;
    }
  }

  const { status, reference, external_reference, amount, operator } = req.body ?? {};
  req.log.info({ status, reference, external_reference, amount, operator }, "Campay webhook received");

  try {
    const orderId = parseOrderId(external_reference ?? "");

    if (status === "SUCCESSFUL") {
      if (orderId) {
        await updateOrder(orderId, { statut: "achat_en_cours" });
        req.log.info({ orderId, reference }, "Order → achat_en_cours (Campay SUCCESSFUL)");
      }
    } else if (status === "FAILED") {
      if (orderId) {
        await updateOrder(orderId, { statut: "en_attente" });
        req.log.info({ orderId, reference }, "Order → en_attente (Campay FAILED)");
      }
    } else {
      req.log.info({ status, reference }, "Campay webhook — statut inconnu, ignoré");
    }
  } catch (err) {
    req.log.error({ err, reference }, "Erreur traitement webhook Campay");
  }
}

router.post("/webhook", handleWebhook);
router.post("/callback", handleWebhook);

// ─── GET /api/payments/callback — redirection navigateur ──────────────────────
router.get("/callback", (_req, res) => {
  res.redirect("https://market-fresh-delivery--makit4079.replit.app/landing/");
});

export default router;
