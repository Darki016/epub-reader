export interface DictionaryResult {
    word: string;
    phonetic?: string;
    audio?: string;
    meanings: {
        partOfSpeech: string;
        definitions: {
            definition: string;
            example?: string;
        }[];
    }[];
    source: 'standard' | 'urban';
    urbanDefinitions?: {
        definition: string;
        example: string;
        thumbs_up: number;
        author: string;
    }[];
}

interface StandardApiResponse {
    word: string;
    phonetic?: string;
    phonetics: Array<{ audio?: string }>;
    meanings: Array<{
        partOfSpeech: string;
        definitions: Array<{
            definition: string;
            example?: string;
        }>;
    }>;
}

interface UrbanApiResponse {
    list: Array<{
        word: string;
        definition: string;
        example: string;
        thumbs_up: number;
        author: string;
    }>;
}

export const fetchDefinition = async (word: string): Promise<DictionaryResult | null> => {
    try {
        const cleanWord = word.trim().toLowerCase().replace(/[^a-zA-Z\s]/g, '');

        // 1. Try Standard Dictionary
        const stdRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);

        let standardData: StandardApiResponse | null = null;
        if (stdRes.ok) {
            const data = await stdRes.json();
            standardData = data[0];
        }

        // 2. Try Urban Dictionary (Unofficial)
        // Note: Using a CORS proxy might be needed in production, but often works directly or via a public proxy.
        // We'll try the direct API first, if it fails due to CORS, we might need a workaround.
        // For development, we'll try direct.
        const urbanRes = await fetch(`https://api.urbandictionary.com/v0/define?term=${cleanWord}`);
        let urbanData: UrbanApiResponse | null = null;
        if (urbanRes.ok) {
            urbanData = await urbanRes.json();
        }

        if (!standardData && (!urbanData || urbanData.list.length === 0)) {
            return null;
        }

        // Construct Result
        const result: DictionaryResult = {
            word: standardData?.word || urbanData?.list[0]?.word || word,
            phonetic: standardData?.phonetic,
            audio: standardData?.phonetics?.find(p => p.audio)?.audio,
            meanings: standardData?.meanings || [],
            source: standardData ? 'standard' : 'urban',
            urbanDefinitions: urbanData?.list?.slice(0, 5).map(item => ({
                definition: item.definition.replace(/[\[\]]/g, ''), // Remove [links]
                example: item.example.replace(/[\[\]]/g, ''),
                thumbs_up: item.thumbs_up,
                author: item.author
            })) || []
        };

        return result;

    } catch (err) {
        console.error('Dictionary fetch failed:', err);
        return null;
    }
};
