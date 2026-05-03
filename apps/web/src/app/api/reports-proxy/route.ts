import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const API_URL = process.env.NEXT_SERVER_API_URL || 'http://localhost:4000';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const qs = searchParams.toString();

  try {
    const res = await fetch(`${API_URL}/reports/export?${qs}`, {
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: 'Error generando reporte' },
        { status: res.status },
      );
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = res.headers.get('content-disposition') || '';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: 'No se pudo conectar con la API de reportes' },
      { status: 502 },
    );
  }
}
