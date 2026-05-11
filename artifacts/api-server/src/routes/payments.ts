import { Router } from "express";

const router = Router();
const KPAY_URL = "https://admin.kpay.site/api/v1/payments/init";

function formatPhone(tel: string): string {
  let phone = tel.replace(/[\s\-().+]/g, "");
  if (phone.startsWith("00237")) phone = phone.slice(2);
  if (phone.startsWith("0")) phone = "237" + phone.slice(1);
  if (!phone.startsWith("237")) phone = "237" + phone;
  return phone;
}

// POST /api/payments/initiate
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

    // KPay envoie un prompt USSD directement sur le téléphone du client
    // Pas d'URL de redirection — la confirmation se fait sur le téléphone
    res.json({
      success: true,
      reference: data.reference ?? null,
      tid: data.id ?? null,
      externalId,
      message: data.message ?? "Demande de paiement envoyée. Confirmez sur votre téléphone.",
    });
  } catch (err) {
    req.log.error({ err }, "KPay API error");
    res.status(500).json({ error: "Service de paiement temporairement indisponible" });
  }
});

// POST /api/payments/callback — webhook KPay
router.post("/callback", (req, res) => {
  req.log.info({ body: req.body }, "KPay webhook callback");
  res.json({ ok: true });
});

// GET /api/payments/callback — redirection après paiement
router.get("/callback", (req, res) => {
  res.json({ ok: true, message: "Paiement reçu" });
});

export default router;
