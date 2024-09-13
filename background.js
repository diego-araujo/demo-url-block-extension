//https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest?hl=pt-br
// Definir uma função assíncrona para atualizar as regras dinâmicas

const API_URL = 'https://api.exemplo.com/lista-bloqueios.json'; // Substitua pela URL da sua API

/**
 * Função para buscar as URLs da API externa.
 * @returns {Promise<string[]>} Uma promessa que resolve para uma lista de URLs.
 */
async function updateUrlsBlockedForUser() {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      const urlsToBlock = data.urls || [];
      await block(urlsToBlock);
    } catch (error) {
      console.error('Erro ao buscar URLs da API:', error);
      return [];
    }
  }

  // Função auxiliar para obter todas as IDs de regras dinâmicas existentes
async function getAllRuleIds() {
    const rules = await chrome.declarativeNetRequest.getDynamicRules();
    return rules.map(rule => rule.id);
}

function extractDomainFromRule(urlPattern) {
    const regex = /\|\|([^/]+)\//;
    const match = urlPattern.match(regex);
    return match ? match[1] : urlPattern;
}

async function block(urls) {
    try {
        const rules = urls.map((url, index) => ({
            id: index + 1, // Identificador único para cada regra
            priority: 1,
            action: {
            type: 'redirect', // Tipo de ação: redirecionamento
            redirect: {
                extensionPath: '/403.html?url='+extractDomainFromRule(url) // Caminho para a página de redirecionamento local
            }
            },
            condition: {
            urlFilter: url, // Cada URL a ser bloqueada/redirecionada
            resourceTypes: ["main_frame", "sub_frame"] 
            }
        }));

    
        // Remove qualquer regra existente com o mesmo ID e adiciona a nova regra
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: (await getAllRuleIds()), // Remove todas as regras anteriores
            addRules: rules // Adiciona as novas regras
        });

            console.log('Regras de bloqueio aplicadas com sucesso.');
    } catch (error) {
        console.error('Erro ao aplicar regras de bloqueio:', error);
    }
  }
  
  const staticUrls = [
    '||google.com/',
    '||uol.com.br/'
  ];
  // Chama a função para bloquear o domínio
  block(staticUrls);
  

// Configura o alarme para disparar a cada minuto (1 minuto = 60.000 ms)
chrome.alarms.create('updateUrlsBlockedForUser', { periodInMinutes: 1 });

// Ouvinte que dispara quando o alarme é acionado
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateUrlsBlockedForUser') {
    updateUrlsBlockedForUser(); 
  }
});