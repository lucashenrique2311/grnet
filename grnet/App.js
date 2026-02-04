import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, TextInput, Alert, Image, Clipboard, ImageBackground } from 'react-native';
import { WebView } from 'react-native-webview';
import { Linking } from 'react-native';
// Removido react-native-mask-text - usando máscara personalizada
import { LinearGradient } from 'expo-linear-gradient';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('main'); // main, segunda-via-cpf, segunda-via-contratos, segunda-via-resultado
  const [cpfInput, setCpfInput] = useState('');
  const [contratos, setContratos] = useState([]);
  const [selectedContrato, setSelectedContrato] = useState(null);
  const [loading, setLoading] = useState(false);

  // Função para formatar CPF/CNPJ
  const formatarCpfCnpj = (texto) => {
    // Remove todos os caracteres não numéricos
    const numeros = texto.replace(/\D/g, '');
    
    // Aplica máscara baseada no comprimento
    if (numeros.length <= 11) {
      // CPF: 000.000.000-00
      return numeros
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0000-00
      return numeros
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  };

  // Função para validar CPF/CNPJ (simplificada - apenas verifica comprimento)
  const validarCpfCnpj = (cpf) => {
    // Remove caracteres especiais
    const cpfLimpo = cpf.replace(/[^\d]/g, '');
    console.log('🔍 Validando CPF:', cpf, '-> Limpo:', cpfLimpo);
    
    // Validação básica apenas de comprimento
    if (cpfLimpo.length === 11) {
      console.log('✅ CPF com 11 dígitos - aceito');
      return true;
    }
    
    if (cpfLimpo.length === 14) {
      console.log('✅ CNPJ com 14 dígitos - aceito');
      return true;
    }
    
    console.log('❌ CPF/CNPJ inválido - comprimento incorreto:', cpfLimpo.length);
    return false;
  };

  // Função para copiar texto para clipboard
  const copiarParaClipboard = async (texto, mensagem = 'Copiado para área de transferência!') => {
    try {
      await Clipboard.setString(texto);
      Alert.alert('Sucesso', mensagem);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível copiar o texto.');
    }
  };

  // Função para formatar data para padrão brasileiro
  const formatarDataBR = (dataString) => {
    if (!dataString) return '';
    
    try {
      // Se a data já estiver no formato brasileiro, retorna como está
      if (dataString.includes('/')) {
        return dataString;
      }
      
      // Remove possíveis espaços e caracteres extras
      const dataLimpa = dataString.trim();
      
      // Converte data ISO (YYYY-MM-DD) para formato brasileiro (DD/MM/AAAA)
      const data = new Date(dataLimpa);
      if (isNaN(data.getTime())) return dataString;
      
      const dia = String(data.getDate()).padStart(2, '0');
      const mes = String(data.getMonth() + 1).padStart(2, '0');
      const ano = data.getFullYear();
      
      return `${dia}/${mes}/${ano}`;
    } catch (error) {
      return dataString; // Retorna original se houver erro
    }
  };

  // Função para formatar valor monetário para padrão brasileiro
  const formatarValorBR = (valor) => {
    if (valor === null || valor === undefined || valor === '') return 'R$ 0,00';
    
    try {
      const numero = parseFloat(valor);
      if (isNaN(numero)) return 'R$ 0,00';
      
      return numero.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      });
    } catch (error) {
      return `R$ ${valor}`;
    }
  };

  // Função para buscar contratos na API
  const buscarContratos = async (cpf) => {
    setLoading(true);
    try {
      console.log('🔍 Buscando contratos para CPF:', cpf);
      
      // Criar FormData como no Postman
      const formData = new FormData();
      formData.append('token', '15f7f59f-b03b-4b1b-9d39-0ea16287f837');
      formData.append('app', 'mikrotik');
      formData.append('cpfcnpj', cpf);

      const response = await fetch('https://sistema.grtelecomba.com.br/api/ura/consultacliente/', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      const data = await response.json();
      console.log('📡 Resposta da API:', data);
      
      // Verificar se a API retornou dados válidos
      if (data && data.contratos) {
        if (data.contratos.length > 0) {
          console.log('✅ Contratos encontrados:', data.contratos.length);
          setContratos(data.contratos);
          setCurrentScreen('segunda-via-contratos');
        } else {
          console.log('❌ Nenhum contrato encontrado');
          Alert.alert(
            'Aviso', 
            'CPF/CNPJ encontrado, mas não há contratos ativos para segunda via.',
            [
              {
                text: 'OK',
                style: 'default'
              }
            ]
          );
        }
      } else if (data && data.msg) {
        // Se a API retornou uma mensagem específica
        console.log('📝 Mensagem da API:', data.msg);
        if (data.msg.includes('Localizado') || data.msg.includes('encontrado') || data.msg.includes('Localizado')) {
          // Mesmo sem contratos, o CPF foi encontrado
          Alert.alert(
            'Aviso', 
            'CPF/CNPJ encontrado, mas não há contratos ativos para segunda via.',
            [
              {
                text: 'OK',
                style: 'default'
              }
            ]
          );
        } else {
          Alert.alert('Erro', data.msg || 'CPF/CNPJ não encontrado em nossa base de dados.');
        }
      } else if (data && Object.keys(data).length === 0) {
        // Resposta vazia da API
        console.log('❌ API retornou resposta vazia');
        Alert.alert('Aviso', 'CPF/CNPJ não encontrado em nossa base de dados.');
      } else {
        console.log('❌ Resposta inválida da API:', data);
        Alert.alert('Erro', 'Resposta inválida do servidor. Tente novamente.');
      }
    } catch (error) {
      console.error('💥 Erro na API:', error);
      Alert.alert('Erro', 'Erro ao conectar com o servidor. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para gerar segunda via
  const gerarSegundaVia = async (contrato) => {
    setLoading(true);
    try {
      // Criar FormData como no Postman
      const formData = new FormData();
      formData.append('token', '15f7f59f-b03b-4b1b-9d39-0ea16287f837');
      formData.append('app', 'mikrotik');
      formData.append('contrato', contrato.contratoId);

      const response = await fetch('https://sistema.grtelecomba.com.br/api/ura/fatura2via/', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.status) {
        setSelectedContrato({
          ...contrato,
          fatura: data.links[0].id,
          protocolo: data.protocolo,
          valor: data.links[0].valor,
          vencimento: data.links[0].vencimento,
          linhaDigitavel: data.links[0].linhadigitavel,
          link: data.links[0].link,
          codigopix: data.links[0].codigopix,
          valor_original: data.links[0].valor_original,
          multa: data.links[0].multa,
          juros: data.links[0].juros,
          desconto_vencimento: data.links[0].desconto_vencimento,
          razaoSocial: data.razaoSocial,
          cpfCnpj: data.cpfCnpj
        });
        setCurrentScreen('segunda-via-resultado');
      } else {
        Alert.alert('Erro', 'Nenhum boleto disponível para este contrato.');
      }
    } catch (error) {
      console.error('Erro na API:', error);
      Alert.alert('Erro', 'Erro ao gerar segunda via. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Tela principal
  const renderMainScreen = () => (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.welcomeText}>
        Olá! Como podemos ajudar você hoje?
      </Text>

      <View style={styles.gridContainer}>
        <TouchableOpacity style={styles.card} onPress={() => setCurrentScreen('segunda-via-cpf')}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📄</Text>
          </View>
          <Text style={styles.cardTitle}>Segunda Via</Text>
          <Text style={styles.cardSubtitle}>Boletos e faturas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => setCurrentScreen('speedtest')}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🚀</Text>
          </View>
          <Text style={styles.cardTitle}>Teste de Velocidade</Text>
          <Text style={styles.cardSubtitle}>Testar velocidade</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => setCurrentScreen('contatos')}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📞</Text>
          </View>
          <Text style={styles.cardTitle}>Contatos</Text>
          <Text style={styles.cardSubtitle}>Fale conosco</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => {
          const phoneNumber = '557141023977';
          const message = 'Olá! Preciso de suporte técnico.';
          const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
          Linking.openURL(url);
        }}>
          <View style={styles.iconContainer}>
            <Image 
              source={require('./assets/whatsapp.png')} 
              style={styles.whatsappIconMain}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.cardTitle}>Suporte WhatsApp</Text>
          <Text style={styles.cardSubtitle}>Atendimento rápido</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => {
          const instagramUrl = 'https://www.instagram.com/grnetba/';
          Linking.openURL(instagramUrl);
        }}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📱</Text>
          </View>
          <Text style={styles.cardTitle}>Redes Sociais</Text>
          <Text style={styles.cardSubtitle}>Siga-nos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => setCurrentScreen('pdf-viewer')}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>📄</Text>
          </View>
          <Text style={styles.cardTitle}>Contrato</Text>
          <Text style={styles.cardSubtitle}>Visualizar contrato</Text>
        </TouchableOpacity>

        </View>
      </ScrollView>
  );

  // Tela de digitação do CPF
  const renderCpfScreen = () => (
    <View style={styles.content}>
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Segunda Via de Boletos</Text>
        <Text style={styles.formSubtitle}>Digite seu CPF/CNPJ para continuar</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Digite seu CPF/CNPJ"
          value={cpfInput}
          onChangeText={(text) => {
            const formatted = formatarCpfCnpj(text);
            setCpfInput(formatted);
          }}
          keyboardType="numeric"
          maxLength={18}
          placeholderTextColor="#999"
        />
        
        <TouchableOpacity 
          style={[styles.button, styles.buttonSearch, loading && styles.buttonDisabled]}
          onPress={() => {
            console.log('🔍 Botão buscar pressionado com CPF:', cpfInput);
            
            if (cpfInput.trim() === '') {
              Alert.alert('Erro', 'Por favor, digite seu CPF/CNPJ.');
              return;
            }
            
            const cpfLimpo = cpfInput.replace(/[^\d]/g, '');
            console.log('🧹 CPF limpo:', cpfLimpo);
            
            // Validação básica de comprimento
            if (cpfLimpo.length !== 11 && cpfLimpo.length !== 14) {
              Alert.alert('Erro', 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.');
              return;
            }
            
            // Validação básica apenas (aceita qualquer CPF com 11 dígitos)
            if (cpfLimpo.length === 11) {
              console.log('✅ CPF com 11 dígitos, buscando contratos...');
              console.log('📱 CPF aceito:', cpfLimpo);
              buscarContratos(cpfLimpo);
            } else if (cpfLimpo.length === 14) {
              console.log('✅ CNPJ com 14 dígitos, buscando contratos...');
              console.log('📱 CNPJ aceito:', cpfLimpo);
              buscarContratos(cpfLimpo);
            } else {
              console.log('❌ Comprimento inválido:', cpfLimpo.length);
              Alert.alert('Erro', 'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos.');
            }
          }}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Buscando...' : 'Buscar Contratos'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            setCurrentScreen('main');
            setCpfInput('');
          }}
        >
          <Text style={styles.backButtonText}>← Voltar ao Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Tela de seleção de contratos
  const renderContratosScreen = () => (
    <View style={styles.content}>
      
      <ScrollView 
        style={styles.contratosList} 
        contentContainerStyle={styles.contratosListContent}
        showsVerticalScrollIndicator={false}
      >
        {contratos.map((contrato, index) => (
          <TouchableOpacity
            key={index}
            style={styles.contratoItem}
            onPress={() => gerarSegundaVia(contrato)}
          >
            <View style={styles.contratoHeader}>
              <View style={styles.contratoNumber}>
                <Text style={styles.contratoNumberText}>{index + 1}</Text>
              </View>
              <View style={styles.contratoInfo}>
                <Text style={styles.contratoTitle}>
                  {contrato.planointernet}
                </Text>
                <Text style={styles.contratoLogin}>
                  Login: {contrato.servico_login}
                </Text>
              </View>
              <View style={[styles.statusBadge, 
                contrato.contratoStatus === 1 ? styles.statusAtivo : styles.statusInativo
              ]}>
                <Text style={styles.statusText}>
                  {contrato.contratoStatusDisplay}
                </Text>
              </View>
            </View>
            
            <View style={styles.contratoDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📍</Text>
                <Text style={styles.contratoAddress}>
                  {contrato.endereco_logradouro}, {contrato.endereco_numero || 'S/N'} - {contrato.endereco_bairro}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🏙️</Text>
                <Text style={styles.contratoCity}>
                  {contrato.endereco_cidade} - {contrato.endereco_uf}
                </Text>
              </View>
              
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.contratosFooter}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            setCurrentScreen('segunda-via-cpf');
            setContratos([]);
          }}
        >
          <Text style={styles.backButtonText}>← Voltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Tela de resultado da segunda via
  const renderResultadoScreen = () => (
    <View style={styles.content}>
      
      <ScrollView 
        style={styles.resultadoScroll} 
        contentContainerStyle={styles.resultadoScrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultadoCard}>
          {/* Informações principais */}
          <View style={styles.resultadoSection}>
            <Text style={styles.sectionTitle}>📋 Informações do Boleto</Text>
            <View style={styles.infoRow}>
              <Text style={styles.resultadoLabel}>Fatura:</Text>
              <Text style={styles.resultadoValue}>{selectedContrato.fatura}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.resultadoLabel}>Protocolo:</Text>
              <Text style={styles.resultadoValue}>{selectedContrato.protocolo}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.resultadoLabel}>Vencimento:</Text>
              <Text style={styles.resultadoValue}>{formatarDataBR(selectedContrato.vencimento)}</Text>
            </View>
          </View>

          {/* Valores */}
          <View style={styles.resultadoSection}>
            <Text style={styles.sectionTitle}>💰 Valores</Text>
            <View style={styles.infoRow}>
              <Text style={styles.resultadoLabel}>Valor Original:</Text>
              <Text style={styles.resultadoValue}>{formatarValorBR(selectedContrato.valor_original)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.resultadoLabel}>Multa:</Text>
              <Text style={styles.resultadoValue}>{formatarValorBR(selectedContrato.multa)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.resultadoLabel}>Juros:</Text>
              <Text style={styles.resultadoValue}>{formatarValorBR(selectedContrato.juros)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.resultadoLabel}>Desconto até:</Text>
              <Text style={styles.resultadoValue}>
                {selectedContrato.desconto_vencimento ? 
                  formatarDataBR(selectedContrato.desconto_vencimento) : 
                  'Não aplicável'
                }
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.resultadoLabel}>Total a Pagar:</Text>
              <Text style={[styles.resultadoValue, styles.valorTotal]}>{formatarValorBR(selectedContrato.valor)}</Text>
            </View>
          </View>

          {/* Cliente */}
          <View style={styles.resultadoSection}>
            <Text style={styles.sectionTitle}>👤 Dados do Cliente</Text>
            <View style={styles.infoRow}>
              <Text style={styles.resultadoLabel}>Nome:</Text>
              <Text style={styles.resultadoValue}>{selectedContrato.razaoSocial}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.resultadoLabel}>CPF/CNPJ:</Text>
              <Text style={styles.resultadoValue}>{selectedContrato.cpfCnpj}</Text>
            </View>
          </View>

          {/* Pagamento */}
          <View style={styles.resultadoSection}>
            <Text style={styles.sectionTitle}>💳 Formas de Pagamento</Text>
            <View style={styles.infoRow}>
              <Text style={styles.resultadoLabel}>Linha Digitável:</Text>
              <Text style={styles.resultadoValue}>{selectedContrato.linhaDigitavel}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.resultadoLabel}>Código PIX:</Text>
              <Text style={styles.resultadoValue} numberOfLines={2}>{selectedContrato.codigopix}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.resultadoFooter}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => copiarParaClipboard(selectedContrato.codigopix, 'Código PIX copiado para área de transferência!')}
          >
            <Text style={styles.buttonText}>📱 Copiar PIX</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => copiarParaClipboard(selectedContrato.linhaDigitavel, 'Linha digitável copiada para área de transferência!')}
          >
            <Text style={styles.buttonText}>💳 Copiar Linha</Text>
          </TouchableOpacity>
        </View>

        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            setCurrentScreen('segunda-via-contratos');
            setSelectedContrato(null);
          }}
        >
          <Text style={styles.backButtonText}>← Voltar aos Contratos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  // Tela de contatos
  const renderContatosScreen = () => (
    <View style={styles.content}>
      <View style={styles.formContainer}>
        
        <View style={styles.contatosCard}>
          <View style={styles.contatoSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📞</Text>
              <Text style={styles.sectionTitle}>Telefones</Text>
            </View>
            
            <View style={styles.telefonesContainer}>
              <TouchableOpacity 
                style={styles.telefoneItem}
                onPress={() => {
                  const phoneNumber = '557141023977';
                  const url = `https://wa.me/${phoneNumber}`;
                  Linking.openURL(url);
                }}
              >
                <View style={styles.telefoneIconContainer}>
                  <Image 
                    source={require('./assets/whatsapp.png')} 
                    style={styles.whatsappImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.telefoneInfo}>
                  <Text style={styles.telefoneLabel}>Telefone Fixo</Text>
                  <Text style={styles.telefoneValue}>(71) 4102-3977</Text>
                  <Text style={styles.telefoneSubtitle}>Clique para WhatsApp</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.telefoneItem}
                onPress={() => {
                  const phoneNumber = '5571982508635';
                  const url = `https://wa.me/${phoneNumber}`;
                  Linking.openURL(url);
                }}
              >
                <View style={styles.telefoneIconContainer}>
                  <Image 
                    source={require('./assets/whatsapp.png')} 
                    style={styles.whatsappImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.telefoneInfo}>
                  <Text style={styles.telefoneLabel}>WhatsApp</Text>
                  <Text style={styles.telefoneValue}>(71) 98250-8635</Text>
                  <Text style={styles.telefoneSubtitle}>Clique para WhatsApp</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.contatoSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📍</Text>
              <Text style={styles.sectionTitle}>Endereço</Text>
            </View>
            
            <View style={styles.enderecoContainer}>
              <View style={styles.enderecoIconContainer}>
                <Text style={styles.enderecoIcon}>🏢</Text>
              </View>
              <View style={styles.enderecoInfo}>
                <Text style={styles.enderecoValue}>Rua SORIAIA ZACARIAS, N01</Text>
                <Text style={styles.enderecoValue}>SALVADOR / BA</Text>
                <Text style={styles.enderecoValue}>Bairro Nova Sussuarana</Text>
              </View>
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            setCurrentScreen('main');
          }}
        >
          <Text style={styles.backButtonText}>← Voltar ao Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Tela de teste de velocidade
  const renderSpeedtestScreen = () => (
    <View style={styles.content}>
      
      <View style={styles.webviewContainer}>
        <WebView
          source={{ uri: 'https://www.speedtest.net/pt' }}
          style={styles.webview}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Carregando Speedtest...</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => {
          setCurrentScreen('main');
        }}
      >
        <Text style={styles.backButtonText}>← Voltar ao Menu</Text>
      </TouchableOpacity>
    </View>
  );

  // Tela de visualização de PDF
  const renderPdfViewerScreen = () => (
    <View style={styles.content}>
      <ScrollView style={styles.contratoScroll} contentContainerStyle={styles.contratoScrollContent}>
        {/* Header */}
        <View style={styles.contratoHeader}>
          <Text style={styles.contratoMainTitle}>CONTRATO DE PERMANÊNCIA</Text>
          <Text style={styles.contratoMainSubtitle}>Instrumento de vinculação ao Contrato de Prestação de Serviços de Comunicação Multimídia (SCM).</Text>
        </View>

        {/* Identificação da Prestadora */}
        <View style={styles.contratoSection}>
          <Text style={styles.contratoSectionTitle}>Identificação da PRESTADORA</Text>
          <Text style={styles.contratoText}>
            GR NET SERVICOS DE COMUNICACAO MULTIMIDIA LTDA, pessoa jurídica de direito privado, com sede na Rua Soraia Zacarias, N° 1 TERREO, bairro Sussuarana, CEP 41.215-190, Cidade de Salvador, Estado da Bahia, inscrita no CNPJ/MF sob o nº 33.559.963/0001-89, com Ato/Dispensa de Autorização – Anatel nº 1773, de 22 de fevereiro de 2023.
          </Text>
          <Text style={styles.contratoText}>
            Telefone: (71) 4102-3977 • E-mail: grtelecomba@gmail.com • Site: www.grtelecomba.com.br
          </Text>
        </View>

        {/* Identificação do Assinante */}
        <View style={styles.contratoSection}>
          <Text style={styles.contratoSectionTitle}>Identificação do(a) ASSINANTE</Text>
          <Text style={styles.contratoText}>
            Seu nome, residente na RUA sua rua, AREIA BRANCA, SALVADOR, CPF nº 999.999.999-99.
          </Text>
          <Text style={styles.contratoText}>
            Contato: (71) 999999-9999
          </Text>
        </View>

        {/* Cláusula Primeira */}
        <View style={styles.contratoSection}>
          <Text style={styles.contratoClauseTitle}>CLÁUSULA PRIMEIRA – DAS CONDIÇÕES</Text>
          <Text style={styles.contratoNumberedText}>
            1. O presente CONTRATO DE PERMANÊNCIA vincula-se ao Contrato de Prestação de Serviços de Comunicação Multimídia (SCM), e acessórios se houver. Ambos instrumentos formam um só contrato e devem ser lidos e interpretados conjuntamente.
          </Text>
          <Text style={styles.contratoNumberedText}>
            2. O ASSINANTE declara ciência de que, em função do recebimento dos benefícios descritos na cláusula segunda, deverá permanecer vinculado ao PLANO DE SERVIÇO contratado durante o prazo de 12 (doze) meses de permanência mínima, contados da ativação do serviço.
          </Text>
          <Text style={styles.contratoNumberedText}>
            3. Na hipótese de cancelamento do serviço durante o prazo de permanência mínima, o ASSINANTE estará obrigado ao pagamento, em parcela única, dos valores especificados a título de multa por rescisão antecipada do contrato.
          </Text>
          <Text style={styles.contratoNumberedText}>
            4. Os valores devidos serão cobrados pela PRESTADORA mediante envio de boleto bancário. O não pagamento ensejará o envio do nome do ASSINANTE aos cadastros de proteção ao crédito.
          </Text>
          <Text style={styles.contratoNumberedText}>
            5. Na hipótese de redução, alteração para plano inferior ou mudança de endereço ao inicialmente contratado durante o prazo de permanência mínima, será considerada quebra do vínculo de permanência e o ASSINANTE estará sujeito ao pagamento de multa, conforme cláusula terceira.
          </Text>
          <Text style={styles.contratoNumberedText}>
            6. Em caso de transferência de titularidade do Contrato, o futuro ASSINANTE deverá obrigar-se a cumprir todas as estipulações referentes a presente contratação, incluindo o período de permanência mínima restante.
          </Text>
          <Text style={styles.contratoNumberedText}>
            7. Na hipótese de suspensão temporária do serviço a pedido do ASSINANTE, a permanência mínima ficará suspensa, voltando a fluir após o término da suspensão, até que se cumpra o prazo fixado.
          </Text>
          <Text style={styles.contratoNumberedText}>
            8. O ASSINANTE reconhece que lhe foi dada a oportunidade de contratar os serviços prestados pela PRESTADORA sem os benefícios oferecidos por este Contrato.
          </Text>
        </View>

        {/* Cláusula Segunda - Benefícios */}
        <View style={styles.contratoSection}>
          <Text style={styles.contratoClauseTitle}>CLÁUSULA SEGUNDA – DOS BENEFÍCIOS CONCEDIDOS AO ASSINANTE</Text>
          
          <View style={styles.contratoTable}>
            <View style={styles.contratoTableHeader}>
              <Text style={styles.contratoTableHeaderText}>Descrição do benefício</Text>
              <Text style={styles.contratoTableHeaderText}>Valor original</Text>
              <Text style={styles.contratoTableHeaderText}>Valor do benefício</Text>
            </View>
            
            <View style={styles.contratoTableRow}>
              <Text style={styles.contratoTableCell}>Taxa de instalação</Text>
              <Text style={styles.contratoTableCell}>R$ 80,00</Text>
              <Text style={styles.contratoTableCell}>R$ 80,00</Text>
            </View>
            
            <View style={styles.contratoTableRow}>
              <Text style={styles.contratoTableCell}>Equipamento em comodato</Text>
              <Text style={styles.contratoTableCell}>—</Text>
              <Text style={styles.contratoTableCell}>COMODATO</Text>
            </View>
            
            <View style={styles.contratoTableRow}>
              <Text style={styles.contratoTableCell}>Desconto na mensalidade</Text>
              <Text style={styles.contratoTableCell}>—</Text>
              <Text style={styles.contratoTableCell}>—</Text>
            </View>
            
            <View style={styles.contratoTableRow}>
              <Text style={[styles.contratoTableCell, styles.contratoTableTotal]}>Total dos benefícios</Text>
              <Text style={styles.contratoTableCell}>—</Text>
              <Text style={[styles.contratoTableCell, styles.contratoTableTotal]}>R$ 0,00</Text>
            </View>
          </View>
        </View>

        {/* Cláusula Terceira */}
        <View style={styles.contratoSection}>
          <Text style={styles.contratoClauseTitle}>CLÁUSULA TERCEIRA – DA FIDELIDADE CONTRATUAL</Text>
          <Text style={styles.contratoText}>
            Este instrumento formaliza a concessão de benefício ao ASSINANTE (cláusula segunda) e, em contrapartida, o vínculo contratual com a PRESTADORA pelo período mínimo de 12 (doze) meses, a contar da assinatura.
          </Text>
          <Text style={styles.contratoText}>
            Em caso de rescisão antes do término do prazo de permanência, o ASSINANTE deverá restituir à PRESTADORA o valor correspondente ao benefício recebido, proporcionalmente aos meses restantes, conforme fórmula:
          </Text>
          
          <View style={styles.contratoFormula}>
            <Text style={styles.contratoFormulaText}>M = (VTB ÷ MF) × MR</Text>
            <Text style={styles.contratoFormulaDescription}>
              Onde: M = valor da multa; VTB = valor total dos benefícios concedidos; MF = número total de meses de fidelidade; MR = número de meses restantes.
            </Text>
          </View>
        </View>

        {/* Cláusula Quarta */}
        <View style={styles.contratoSection}>
          <Text style={styles.contratoClauseTitle}>CLÁUSULA QUARTA – DISPOSIÇÕES FINAIS</Text>
          <Text style={styles.contratoNumberedText}>
            1. Este CONTRATO DE PERMANÊNCIA vincula-se ao Contrato de Prestação de Serviços de Comunicação Multimídia (SCM), cumprindo-se as determinações nele mencionadas.
          </Text>
          <Text style={styles.contratoNumberedText}>
            2. O tratamento dos dados pessoais do ASSINANTE será realizado pela PRESTADORA conforme disposições do contrato de prestação de serviços estabelecido entre as Partes.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.contratoFooter}>
          <Text style={styles.contratoFooterText}>
            Documento gerado para exibição em dispositivos móveis. Para dúvidas, contate a PRESTADORA.
          </Text>
        </View>
      </ScrollView>
      
      <View style={styles.pdfFooter}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            setCurrentScreen('main');
          }}
        >
          <Text style={styles.backButtonText}>← Voltar ao Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ImageBackground 
      source={require('./assets/fundoazul.png')} 
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar style="auto" />
      
      {/* Header */}
      <View style={styles.header}>
        <Image 
          source={require('./assets/logobranca.png')} 
          style={styles.headerLogo}
        />
      </View>

      {/* Renderiza a tela atual */}
      {currentScreen === 'main' && renderMainScreen()}
      {currentScreen === 'segunda-via-cpf' && renderCpfScreen()}
      {currentScreen === 'segunda-via-contratos' && renderContratosScreen()}
      {currentScreen === 'segunda-via-resultado' && renderResultadoScreen()}
      {currentScreen === 'pdf-viewer' && renderPdfViewerScreen()}
      {currentScreen === 'contatos' && renderContatosScreen()}
      {currentScreen === 'speedtest' && renderSpeedtestScreen()}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  backgroundContainer: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  fullScreenBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  header: {
    backgroundColor: 'transparent',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerLogo: {
    width: 200,
    height: 130,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    backgroundColor: 'transparent',
  },
  welcomeText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 28,
  },
  whatsappIconMain: {
    width: 28,
    height: 28,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
  },
  button: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSearch: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#28a745',
    flex: 1,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    padding: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  contratosList: {
    flex: 1,
  },
  contratosListContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  contratosHeader: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  contratosFooter: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  contratoItem: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contratoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contratoNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contratoNumberText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contratoInfo: {
    flex: 1,
  },
  contratoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  contratoLogin: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusAtivo: {
    backgroundColor: '#d4edda',
  },
  statusInativo: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#155724',
  },
  contratoDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  contratoAddress: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  contratoCity: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  contratoValor: {
    fontSize: 14,
    color: '#dc3545',
    fontWeight: '600',
    flex: 1,
  },
  resultadoCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultadoSection: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  resultadoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    flex: 1,
  },
  resultadoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  valorTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc3545',
  },
  resultadoScroll: {
    flex: 1,
  },
  resultadoScrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  resultadoHeader: {
    padding: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  resultadoFooter: {
    padding: 20,
    paddingTop: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  coberturaCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  coberturaImage: {
    width: '100%',
    height: 400,
    borderRadius: 12,
  },
  contatosCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  contatoSection: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#f0f0f0',
  },
  sectionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  telefonesContainer: {
    gap: 16,
  },
  telefoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  telefoneIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#25D366',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  whatsappImage: {
    width: 24,
    height: 24,
  },
  telefoneInfo: {
    flex: 1,
  },
  telefoneLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  telefoneValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  telefoneSubtitle: {
    fontSize: 12,
    color: '#25D366',
    fontWeight: '500',
  },
  enderecoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  enderecoIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  enderecoIcon: {
    fontSize: 24,
  },
  enderecoInfo: {
    flex: 1,
  },
  enderecoValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
    fontWeight: '500',
    lineHeight: 22,
  },
  speedtestHeader: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  speedtestTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  speedtestSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  contratoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  contratoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  contratoIcon: {
    fontSize: 40,
  },
  contratoCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  contratoCardSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  contratoOptions: {
    gap: 12,
    marginBottom: 20,
  },
  pdfHeader: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  pdfTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  pdfSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  pdfFooter: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
  },
  pdfPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f8f9fa',
  },
  pdfPlaceholderIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  pdfPlaceholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  pdfPlaceholderSubtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  pdfPlaceholderText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  contratoScroll: {
    flex: 1,
  },
  contratoScrollContent: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'white',
  },
  contratoHeader: {
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
  },
  contratoMainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  contratoMainSubtitle: {
    fontSize: 12,
    color: '#000',
    textAlign: 'center',
    lineHeight: 18,
  },
  contratoSection: {
    marginBottom: 32,
  },
  contratoSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  contratoClauseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 20,
    marginTop: 32,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 8,
  },
  contratoText: {
    fontSize: 12,
    color: '#000',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'justify',
  },
  contratoNumberedText: {
    fontSize: 12,
    color: '#000',
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'justify',
    paddingLeft: 20,
  },
  contratoTable: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 16,
    marginBottom: 16,
  },
  contratoTableHeader: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  contratoTableHeaderText: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  contratoTableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  contratoTableCell: {
    flex: 1,
    fontSize: 10,
    color: '#000',
    textAlign: 'center',
  },
  contratoTableTotal: {
    fontWeight: 'bold',
    color: '#000',
  },
  contratoFormula: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#000',
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  contratoFormulaText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  contratoFormulaDescription: {
    fontSize: 10,
    color: '#000',
    textAlign: 'center',
    lineHeight: 16,
  },
  contratoFooter: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  contratoFooterText: {
    fontSize: 10,
    color: '#000',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
