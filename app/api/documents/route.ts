export async function POST() {
  return Response.json({ error: "A aplicação utiliza diretamente o Firebase Storage." }, { status: 410 });
}

export async function GET() {
  return Response.json({ error: "Documento legado indisponível nesta origem." }, { status: 410 });
}
