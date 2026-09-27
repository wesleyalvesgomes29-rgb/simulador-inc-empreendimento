import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { McmvSimulationResult, PropertyDetails } from '../types';
import { formatBRL, formatPercent } from './formatters';

interface GeneratePdfParams {
  nomeCliente: string;
  whatsapp: string;
  email?: string;
  cpf?: string;
  imovelInfo: PropertyDetails;
  valorImovel: number;
  financiamentoCaixa: number;
  subsidioCaixa: number;
  fgts: number;
  sinalAVista: number;
  valorEntradaTotal: number;
  percentualProSoluto: number;
  qtdParcelasObra: number;
  valorParcelaObra: number;
  correcaoObra: string;
  qtdParcelasPosObra: number;
  valorParcelaPosObra: number;
  correcaoPosObra: string;
  intermediarias?: Array<{ valor: number; mesOuPeriodo?: string }>;
  simulationResult: McmvSimulationResult;
  incluirDocumentacao?: boolean;
  valorDocumentacao?: number;
  parcelasDocumentacao?: number;
}

export async function generateProposalPdf(params: GeneratePdfParams): Promise<void> {
  const {
    nomeCliente,
    whatsapp,
    email,
    cpf,
    imovelInfo,
    valorImovel,
    financiamentoCaixa,
    subsidioCaixa,
    fgts,
    sinalAVista,
    valorEntradaTotal,
    percentualProSoluto,
    qtdParcelasObra,
    valorParcelaObra,
    correcaoObra,
    qtdParcelasPosObra,
    valorParcelaPosObra,
    correcaoPosObra,
    intermediarias = [],
    simulationResult,
    incluirDocumentacao,
    valorDocumentacao = 6800,
    parcelasDocumentacao = 36,
  } = params;

  const totalIntermediarias = intermediarias.reduce((sum, item) => sum + (item.valor || 0), 0);

  // Create temporary offscreen container for PDF rendering
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = '800px';
  container.style.padding = '32px';
  container.style.backgroundColor = '#0A0A0A';
  container.style.color = '#F5F5F5';
  container.style.fontFamily = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  container.innerHTML = `
    <div style="border: 2px solid #2A2A2A; border-radius: 20px; padding: 28px; background-color: #141414; box-sizing: border-box; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);">
      
      <!-- Top Brand Header with INC Orange Accent Banner -->
      <div style="background: linear-gradient(135deg, #1A1A1A 0%, #111111 100%); border: 1px solid #2A2A2A; border-left: 6px solid #FF600B; border-radius: 14px; padding: 20px 24px; margin-bottom: 20px; color: #FFFFFF; display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <div style="width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #FF600B 0%, #D94D00 100%); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 22px; color: #FFFFFF; box-shadow: 0 4px 14px rgba(255, 96, 11, 0.35);">
            INC
          </div>
          <div>
            <h1 style="font-size: 22px; font-weight: 900; color: #FFFFFF; margin: 0; letter-spacing: -0.5px; text-transform: uppercase;">INC EMPREENDIMENTOS</h1>
            <p style="font-size: 11px; font-weight: 700; color: #FF600B; margin: 3px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">SIMULADOR MCMV 2026 • ESTIMATIVA COMERCIAL</p>
          </div>
        </div>
        <div style="text-align: right;">
          <span style="background-color: rgba(255, 96, 11, 0.15); color: #FF600B; padding: 6px 14px; border-radius: 8px; font-size: 11px; font-weight: 900; display: inline-block; letter-spacing: 0.5px; border: 1px solid rgba(255, 96, 11, 0.3);">
            PROPOSTA COMERCIAL
          </span>
          <p style="font-size: 11px; color: #B5B5B5; margin: 6px 0 0 0; font-weight: 600;">Emissão: ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      <!-- Customer & Profile Info -->
      <div style="background-color: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 14px; padding: 16px; margin-bottom: 16px;">
        <h3 style="font-size: 11px; font-weight: 800; color: #FF600B; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">DADOS DO CLIENTE & ENQUADRAMENTO MCMV</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
          <div style="color: #B5B5B5;"><strong style="color: #FFFFFF;">Cliente:</strong> ${nomeCliente || 'Não informado'}</div>
          <div style="color: #B5B5B5;"><strong style="color: #FFFFFF;">WhatsApp:</strong> ${whatsapp || 'Não informado'}</div>
          ${email ? `<div style="color: #B5B5B5;"><strong style="color: #FFFFFF;">E-mail:</strong> ${email}</div>` : ''}
          ${cpf ? `<div style="color: #B5B5B5;"><strong style="color: #FFFFFF;">CPF:</strong> ${cpf}</div>` : ''}
          <div style="color: #B5B5B5;"><strong style="color: #FFFFFF;">Renda Familiar:</strong> ${formatBRL(simulationResult.income)}</div>
          <div style="color: #B5B5B5;"><strong style="color: #FFFFFF;">Perfil MCMV:</strong> ${simulationResult.perfilLabel} (${simulationResult.faixa})</div>
        </div>
      </div>

      <!-- Property Details -->
      <div style="background-color: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 14px; padding: 16px; margin-bottom: 16px;">
        <h3 style="font-size: 11px; font-weight: 800; color: #FF600B; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">EMPREENDIMENTO INC</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px;">
          <div style="color: #B5B5B5;"><strong style="color: #FFFFFF;">Empreendimento:</strong> ${imovelInfo.nomeImovel} - INC Empreendimentos</div>
          <div style="color: #B5B5B5;"><strong style="color: #FFFFFF;">Tipologia:</strong> ${imovelInfo.tipologia}</div>
          ${imovelInfo.unidade ? `<div style="color: #B5B5B5;"><strong style="color: #FFFFFF;">Unidade:</strong> ${imovelInfo.unidade}</div>` : ''}
          <div style="color: #B5B5B5;"><strong style="color: #FFFFFF;">Localização:</strong> ${imovelInfo.localizacao || 'Uberlândia - MG'}</div>
          <div style="grid-column: span 2; background-color: #111111; border: 1px solid #2A2A2A; padding: 12px 16px; border-radius: 10px; margin-top: 6px; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: 700; color: #B5B5B5;">VALOR DO IMÓVEL:</span>
            <strong style="color: #FF600B; font-size: 18px; font-weight: 900;">${formatBRL(valorImovel)}</strong>
          </div>
        </div>
      </div>

      <!-- Financing & Subsidies Breakdown -->
      <div style="background-color: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 14px; padding: 16px; margin-bottom: 16px;">
        <h3 style="font-size: 11px; font-weight: 800; color: #FF600B; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">COMPOSIÇÃO DO FINANCIAMENTO CAIXA (MCMV)</h3>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
          <span style="color: #B5B5B5;">Financiamento CAIXA Estimado:</span>
          <strong style="color: #FFFFFF;">${formatBRL(financiamentoCaixa)}</strong>
        </div>

        ${simulationResult.parcela > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
          <span style="color: #B5B5B5;">Parcela Estimada CAIXA (${simulationResult.faixa}):</span>
          <strong style="color: #FFFFFF;">${formatBRL(simulationResult.parcela)} (Tabela PRICE)</strong>
        </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
          <span style="color: #B5B5B5;">Subsídio MCMV (${simulationResult.faixa}):</span>
          <strong style="color: #FF600B;">${formatBRL(subsidioCaixa)} (Desconto do Governo)</strong>
        </div>

        ${fgts > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px;">
          <span style="color: #B5B5B5;">Utilização de Saldo FGTS:</span>
          <strong style="color: #FFFFFF;">${formatBRL(fgts)}</strong>
        </div>
        ` : ''}

        <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #2A2A2A; font-size: 14px; font-weight: 900; color: #FF600B;">
          <span>ENTRADA TOTAL / PRÓ-SOLUTO INC:</span>
          <span>${formatBRL(valorEntradaTotal)} (${percentualProSoluto.toFixed(1)}% do imóvel)</span>
        </div>
      </div>

      <!-- Construction / Developer Entry Flow Breakdown -->
      <div style="background-color: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 14px; padding: 16px; margin-bottom: 16px;">
        <h3 style="font-size: 11px; font-weight: 800; color: #FF600B; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 10px 0;">FLUXO DE PAGAMENTO DA ENTRADA (PRÓ-SOLUTO INC)</h3>
        
        ${sinalAVista > 0 ? `
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; background-color: #111111; border: 1px solid #2A2A2A; padding: 10px 14px; border-radius: 8px;">
          <span style="color: #B5B5B5;">Sinal / Ato Inicial (em dinheiro):</span>
          <strong style="color: #FF600B; font-size: 15px;">${formatBRL(sinalAVista)}</strong>
        </div>
        ` : ''}

        <div style="display: grid; grid-template-columns: ${qtdParcelasPosObra > 0 ? '1fr 1fr' : '1fr'}; gap: 12px; margin-bottom: 12px;">
          ${qtdParcelasObra > 0 ? `
          <div style="background-color: #111111; padding: 14px; border-radius: 10px; border: 1px solid #FF600B;">
            <div style="font-size: 11px; font-weight: 800; color: #FF600B; text-transform: uppercase;">DURANTE A OBRA (${qtdParcelasObra}x)</div>
            <div style="font-size: 19px; font-weight: 900; color: #FFFFFF; margin-top: 4px;">${formatBRL(valorParcelaObra)}</div>
            <div style="font-size: 10px; color: #B5B5B5; margin-top: 2px;">Correção: ${correcaoObra || 'INCC'}</div>
          </div>
          ` : ''}

          ${qtdParcelasPosObra > 0 ? `
          <div style="background-color: #111111; padding: 14px; border-radius: 10px; border: 1px solid #2A2A2A;">
            <div style="font-size: 11px; font-weight: 800; color: #FF7A00; text-transform: uppercase;">PÓS-CHAVES / PÓS-OBRA (${qtdParcelasPosObra}x)</div>
            <div style="font-size: 19px; font-weight: 900; color: #FFFFFF; margin-top: 4px;">${formatBRL(valorParcelaPosObra)}</div>
            <div style="font-size: 10px; color: #B5B5B5; margin-top: 2px;">Correção: ${correcaoPosObra || 'IPCA + 1,99% a.a.'}</div>
          </div>
          ` : ''}
        </div>

        ${totalIntermediarias > 0 ? `
        <div style="background-color: #111111; border: 1px solid #2A2A2A; border-left: 4px solid #FF600B; padding: 12px 14px; border-radius: 8px; margin-bottom: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-size: 11px; font-weight: 800; color: #FF600B; text-transform: uppercase;">INTERMEDIÁRIAS / BALÕES (${intermediarias.length}x)</span>
            <strong style="color: #FFFFFF; font-size: 13px;">Total: ${formatBRL(totalIntermediarias)}</strong>
          </div>
          <div style="font-size: 12px; color: #B5B5B5;">
            ${intermediarias.map((item, idx) => `
              <div style="display: flex; justify-content: space-between; padding: 3px 0; border-bottom: ${idx < intermediarias.length - 1 ? '1px dashed #222222' : 'none'};">
                <span>${idx + 1}ª Intermediária (${item.mesOuPeriodo || 'Período a definir'}):</span>
                <strong style="color: #FFFFFF;">${formatBRL(item.valor)}</strong>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
      </div>

      <!-- Legal / Footer Notes -->
      <div style="font-size: 10px; color: #71717A; line-height: 1.5; border-top: 1px solid #2A2A2A; padding-top: 14px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="max-width: 500px;">
          ${incluirDocumentacao ? `<p style="margin: 0 0 3px 0; color: #B5B5B5;"><strong style="color: #FFFFFF;">Documentação (Registro + ITBI):</strong> ${formatBRL(valorDocumentacao)} em até ${parcelasDocumentacao}x.</p>` : ''}
          <p style="margin: 0 0 3px 0;">* Valores aproximados para fins de simulação. A aprovação, subsídio, taxa, prazo e condições finais dependem da análise oficial da Caixa Econômica Federal e da documentação apresentada.</p>
          <p style="margin: 0;">* Valores e condições podem sofrer alterações sem aviso prévio conforme política comercial da INC Empreendimentos.</p>
        </div>
        <div style="text-align: right;">
          <strong style="color: #FFFFFF; font-size: 11px; display: block;">INC EMPREENDIMENTOS</strong>
          <span style="color: #FF600B; font-size: 10px; font-weight: 700;">Simulador MCMV • Estimativa Comercial</span>
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: '#0A0A0A',
      useCORS: true,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgWidth = 210; // A4 width in mm
    const pageHeight = 297; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
    
    const clientSanitized = (nomeCliente || 'cliente').replace(/[^a-zA-Z0-9]/g, '_');
    const imovelSanitized = (imovelInfo.nomeImovel || 'imovel').replace(/[^a-zA-Z0-9]/g, '_');
    pdf.save(`Proposta_INC_${imovelSanitized}_${clientSanitized}.pdf`);
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
  } finally {
    document.body.removeChild(container);
  }
}
