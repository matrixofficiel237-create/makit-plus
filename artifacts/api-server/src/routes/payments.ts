import { Router } from "express";

const router = Router();
const KPAY_URL = "https://pay.esicia.com/";

function formatPhone(tel: string): string {
  let phone = tel.replace(/[\s\-().+]/g, "");
  if (phone.startsWith("00237")) phone = phone.slice(2);
  if (phone.startsWith("0")) phone = "237" + phone.slice(1);
  if (!phone.startsWith("237")) phone = "237" + phone;
  return phone;
}

// POST /api/payments/initiate
router.post("/initiate", async (req, res) => {
  const { telephone, amount, method, orderId, userName } = req.body;

  if (!telephone || !amount || !method) {
    res.status(400).json({ error: "Données manquantes (telephone, amount, method)" });
    return;
  }

  const msisdn = formatPhone(String(telephone));
  const refid = `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const pmethod = method === "momo" ? "momo" : "orange";

  try {
    const kpayRes = await fetch(KPAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.KPAY_API_KEY ?? ""}`,
      },
      body: JSON.stringify({
        action: "pay",
        msisdn,
        details: `Commande Makit+ ${orderId ?? ""}`.trim(),
        refid,
        amount: Number(amount),
        currency: "XAF",
        email: "client@makit.cm",
        cname: userName ?? "Client Makit+",
        cnumber: msisdn,
        pmethod,
        pin: process.env.KPAY_SECRET_KEY ?? "",
        returl: "https://market-fresh-delivery--makit4079.replit.app/api/payments/callback",
        redirecturl: "https://market-fresh-delivery--makit4079.replit.app/landing/",
      }),
    });

    const data = await kpayRes.json() as any;
    req.log.info({ data, msisdn, amount, pmethod }, "KPay initiate response");

    if (data.success === 1) {
      res.json({ url: data.url, tid: data.tid, refid });
    } else {
      res.status(400).json({ error: data.reply ?? "Paiement refusé par l'opérateur" });
    }
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
