
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
        promptText = "Analyze this image to identify recyclable waste. Identify items that are plastic, glass, organic, or metal. For each identified item, provide its name (e.g. 'Plastic Bottle', 'Apple Core'), a confidence score, and a bounding box.";
    } else if (mode === 'crop') {
        promptText = "Analyze this image for agricultural health. Identify crops (e.g., Maize, Cassava, Tomato), and specifically look for signs of disease (Blight, Rust), pests, nutrient deficiency, or healthy growth. Label the detected areas (e.g., 'Maize (Healthy)', 'Tomato (Blight)'). Provide confidence and bounding boxes.";
    } else if (mode === 'water') {
        promptText = "Analyze this image for water source safety. Identify the water source (e.g., Borehole, River, Bucket, Tap) and visual indicators of quality or risk (e.g., Clear Water, Turbid/Muddy, Algae, Livestock Nearby). Label the detected areas. Provide confidence and bounding boxes.";
    }

    const textPart = {
      text: `${promptText} Return the result as a JSON array of objects with 'label', 'confidence' (0.0-1.0), and 'boundingBox' [ymin, xmin, ymax, xmax]. If nothing relevant is found, return an empty array.`,
    };
    
    const schema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { 
              type: Type.STRING, 
              description: "The label of the detected object (e.g., 'Plastic Bottle', 'Maize (Healthy)')."
            },
            confidence: { 
              type: Type.NUMBER,
              description: "The confidence score of the detection, from 0.0 to 1.0."
            },
            boundingBox: {
              type: Type.ARRAY,
              description: "The bounding box coordinates [x_min, y_min, x_max, y_max] normalized to image dimensions.",
              items: { type: Type.NUMBER },
              minItems: 4,
              maxItems: 4
            }
          },
          required: ['label', 'confidence', 'boundingBox']
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
