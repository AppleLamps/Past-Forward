/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Variation arrays for dynamic prompt generation
export const POSE_VARIATIONS = [
    "formal pose",
    "casual pose",
    "candid pose",
    "studio pose",
    "confident pose",
    "relaxed pose",
    "dramatic pose",
    "playful pose",
    "elegant pose",
    "natural pose"
];

export const LIGHTING_VARIATIONS = [
    "natural lighting",
    "studio lighting",
    "soft focus lighting",
    "flash photography",
    "golden hour lighting",
    "harsh lighting",
    "even lighting",
    "backlit",
    "side-lit",
    "rim lighting",
    "moonlight",
    "neon lighting",
    "candlelight"
];

export const ACCESSORY_VARIATIONS = [
    "with subtle props",
    "with era-appropriate accessories",
    "minimalist setup",
    "vintage backdrop",
    "with period jewelry",
    "with hats",
    "with glasses",
    "with hand props",
    "with vintage furniture",
    "with outdoor elements",
    "with musical instruments",
    "with books",
    "with vehicles"
];

// Decade-specific prompts for more authentic and detailed image generation.
export const DECADE_PROMPTS: Record<string, string> = {
    '1950s': `Transform this person into a 1950s portrait photograph. Style: Post-war American aesthetic with high-contrast black and white or early Kodachrome color. Fashion: Men in fedoras, suits with wide lapels, slicked hair; Women in circle skirts, victory rolls, cat-eye glasses. Photography: Grainy film texture, studio lighting, formal pose. Maintain the person's facial features and identity exactly.`,

    '1960s': `Transform this person into a 1960s portrait photograph. Style: Mod era with vibrant colors or high-contrast B&W. Fashion: Men in slim suits, Beatles haircuts; Women in shift dresses, bouffant hair, bold eyeliner. Photography: Kodak Instamatic quality, natural lighting, candid pose. Preserve the person's exact facial features and likeness.`,

    '1970s': `Transform this person into a 1970s portrait photograph. Style: Warm, faded colors with orange/brown tones. Fashion: Men in wide collars, bell-bottoms, long hair/sideburns; Women in platform shoes, maxi dresses, feathered hair. Photography: Polaroid or 35mm film grain, soft focus, casual pose. Keep the person's face identical.`,

    '1980s': `Transform this person into a 1980s portrait photograph. Style: Bright, saturated colors with high contrast. Fashion: Men in power suits, mullets; Women in shoulder pads, big hair, bold makeup. Photography: Flash photography look, sharp focus, studio backdrop. Maintain exact facial features and identity.`,

    '1990s': `Transform this person into a 1990s portrait photograph. Style: Slightly desaturated colors or grunge aesthetic. Fashion: Men in baggy jeans, flannel, curtain hair; Women in chokers, slip dresses, straight hair. Photography: Disposable camera or early digital quality, casual lighting. Preserve the person's facial likeness exactly.`,

    '2000s': `Transform this person into a 2000s portrait photograph. Style: Early digital camera aesthetic with slight overexposure. Fashion: Men in popped collars, frosted tips; Women in low-rise jeans, butterfly clips, thin eyebrows. Photography: Digital camera quality, flash, MySpace-style pose. Keep the person's face and features identical.`
};

/**
 * Gets a random element from an array.
 */
function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Gets random variations for prompt generation.
 */
export function getRandomVariations() {
    return {
        pose: getRandomElement(POSE_VARIATIONS),
        lighting: getRandomElement(LIGHTING_VARIATIONS),
        accessory: getRandomElement(ACCESSORY_VARIATIONS),
    };
}

/**
 * Creates a fallback prompt to use when the primary one is blocked.
 * @param decade The decade string (e.g., "1950s").
 * @returns The fallback prompt string.
 */
export function getFallbackPrompt(decade: string): string {
    return `Create a photograph of the person in this image as if they were living in the ${decade}. The photograph should capture the distinct fashion, hairstyles, and overall atmosphere of that time period. Ensure the final image is a clear photograph that looks authentic to the era.`;
}
