// src/middlewares/notFound.js
export default function notFound(_req, res) {
    res.status(404).json({ error: "Rota não encontrada" });
}
