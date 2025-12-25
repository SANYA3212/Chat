
export async function fetchGeneratedTitle(history, modelForTitle) {
    try {
        const response = await fetch('/generate-title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                history: history,
                model: modelForTitle,
            }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data.title;
    } catch (error) {
        console.error('Error generating title:', error);
        // Return a default or null value to indicate failure
        return null;
    }
}
