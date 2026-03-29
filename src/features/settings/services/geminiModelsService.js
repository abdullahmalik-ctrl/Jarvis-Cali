import { fetchModelsViaGateway } from '@shared/services/geminiGatewayService';

export const fetchAvailableGeminiModels = async (key) => {
    return fetchModelsViaGateway(key || undefined);
};
