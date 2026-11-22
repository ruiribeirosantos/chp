export async function GET() {
  return Response.json({ error: "A aplicação utiliza diretamente o Firestore." }, { status: 410 });
}

export async function PUT() {
  return Response.json({ error: "A aplicação utiliza diretamente o Firestore." }, { status: 410 });
}
