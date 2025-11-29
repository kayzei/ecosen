
import { GoogleGenAI, Type } from "@google/genai";
import { DetectedObject, ScanMode } from '../types';

const geminiService = {
  analyzeImage: async (
    base64Image: string,
    mimeType: string,
    mode: ScanMode
  ): Promise<DetectedObject[]> => {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    };

    let promptText = "";
    if (mode === 'waste') {
        promptText = "Analyze this image to identify recyclable waste. Identify items that are plastic, glass, organic, or metal. For each identified item, provide its name, a confidence score, a bounding box, and a specific disposal recommendation (e.g. 'Rinse and recycle', 'Compost bin').";
    } else if (mode === 'crop') {
        promptText = "Analyze this image for agricultural health. Identify crops and signs of disease or pests. Label the detected areas. Provide confidence, bounding boxes, and a farming recommendation (e.g. 'Apply fungicide', 'Increase watering', 'Monitor closely').";
    } else if (mode === 'water') {
        promptText = "Analyze this image for water source safety. Identify the water source and visual indicators of quality. Label the detected areas. Provide confidence, bounding boxes, and a safety recommendation (e.g. 'Boil before drinking', 'Safe for irrigation', 'Test for bacteria').";
    }

    const textPart = {
      text: `${promptText} Return the result as a JSON array of objects with 'label', 'confidence' (0.0-1.0), 'boundingBox' [ymin, xmin, ymax, xmax], and 'recommendation' (string).`,
    };
    
    const schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            boundingBox: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              minItems: 4,
              maxItems: 4
            },
            recommendation: { type: Type.STRING, description: "Actionable advice or tip for this item." }
          },
          required: ['label', 'confidence', 'boundingBox', 'recommendation']
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        
        const jsonString = response.text;
        const result = JSON.parse(jsonString);
        return result as DetectedObject[];
    } catch (error) {
        console.error("Error analyzing image with Gemini:", error);
        throw new Error("Failed to analyze image. Please try again.");
    }
  },
};

export default geminiService;
