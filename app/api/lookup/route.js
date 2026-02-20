import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { npi } = await request.json();

        // Validate NPI format
        if (!npi || !/^\d{10}$/.test(npi)) {
            return NextResponse.json(
                { error: 'Please enter a valid 10-digit NPI number.' },
                { status: 400 }
            );
        }

        // Step 1: Look up NPI in NPPES Registry
        const nppes = await fetchNPPES(npi);
        if (!nppes) {
            return NextResponse.json(
                { error: 'No provider found for this NPI number.' },
                { status: 404 }
            );
        }

        // Step 2: Enrich with Exa.ai LinkedIn search
        let exa = null;
        const exaKey = process.env.EXA_API_KEY;
        if (exaKey && exaKey !== 'your_exa_api_key_here') {
            exa = await fetchExa(nppes.firstName, nppes.lastName, nppes.specialty, exaKey);
        }

        // Step 3: Merge and return
        return NextResponse.json({
            npi: nppes,
            linkedin: exa,
        });
    } catch (err) {
        console.error('Lookup error:', err);
        return NextResponse.json(
            { error: 'An unexpected error occurred. Please try again.' },
            { status: 500 }
        );
    }
}

// ─── NPPES Registry Lookup ──────────────────────────────────────────
async function fetchNPPES(npi) {
    const url = `https://npiregistry.cms.hhs.gov/api/?version=2.1&number=${npi}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.results || data.results.length === 0) return null;

    const r = data.results[0];
    const basic = r.basic || {};
    const taxonomies = r.taxonomies || [];
    const addresses = r.addresses || [];
    const locationAddr = addresses.find(a => a.address_purpose === 'LOCATION') || addresses[0] || {};

    const primaryTaxonomy = taxonomies.find(t => t.primary) || taxonomies[0] || {};

    return {
        npiNumber: r.number,
        firstName: capitalize(basic.first_name),
        lastName: capitalize(basic.last_name),
        credential: basic.credential || '',
        namePrefix: basic.name_prefix || '',
        sex: basic.sex || '',
        specialty: primaryTaxonomy.desc || 'Unknown',
        allSpecialties: [...new Set(taxonomies.map(t => t.desc).filter(Boolean))],
        practiceAddress: {
            address: locationAddr.address_1 || '',
            city: capitalize(locationAddr.city),
            state: locationAddr.state || '',
            zip: formatZip(locationAddr.postal_code),
            phone: locationAddr.telephone_number || '',
        },
        enumerationType: r.enumeration_type,
        enumerationDate: basic.enumeration_date || '',
        lastUpdated: basic.last_updated || '',
        status: basic.status === 'A' ? 'Active' : 'Inactive',
    };
}

// ─── Exa.ai LinkedIn Enrichment ─────────────────────────────────────
async function fetchExa(firstName, lastName, specialty, apiKey) {
    try {
        const query = `${firstName} ${lastName} ${specialty} physician`;
        const res = await fetch('https://api.exa.ai/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
            },
            body: JSON.stringify({
                query,
                category: 'people',
                numResults: 1,
                type: 'auto',
                contents: {
                    highlights: {
                        maxCharacters: 4000,
                    },
                },
            }),
        });

        const data = await res.json();

        if (!data.results || data.results.length === 0) return null;

        const result = data.results[0];
        const entity = result.entities?.[0];
        const props = entity?.properties || {};

        return {
            linkedinUrl: result.url || null,
            headline: result.title || null,
            image: result.image || null,
            author: result.author || null,
            highlights: result.highlights || [],
            name: props.name || null,
            location: props.location || null,
            workHistory: (props.workHistory || []).map(w => ({
                title: w.title,
                company: w.company?.name || '',
                from: w.dates?.from || '',
                to: w.dates?.to || 'Present',
                location: w.location || null,
            })),
            educationHistory: (props.educationHistory || []).map(e => ({
                degree: e.degree,
                institution: e.institution?.name || '',
                from: e.dates?.from || '',
                to: e.dates?.to || '',
            })),
            costDollars: data.costDollars?.total || 0,
        };
    } catch (err) {
        console.error('Exa.ai error:', err);
        return null;
    }
}

// ─── Helpers ────────────────────────────────────────────────────────
function capitalize(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function formatZip(zip) {
    if (!zip) return '';
    const clean = zip.replace(/\D/g, '');
    return clean.length > 5 ? `${clean.slice(0, 5)}-${clean.slice(5)}` : clean;
}
