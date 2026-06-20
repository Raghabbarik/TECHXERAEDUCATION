import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  
  if (!url || !url.includes('docs.google.com/spreadsheets')) {
    return NextResponse.json({ error: 'Invalid Google Sheets URL' }, { status: 400 });
  }

  try {
    const exportUrl = url.replace(/\/edit.*$/, '/export?format=csv');
    const response = await fetch(exportUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch the sheet. Ensure it is set to "Anyone with the link can view".' }, { status: response.status });
    }

    const csvText = await response.text();
    return new NextResponse(csvText, {
      headers: {
        'Content-Type': 'text/csv',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
