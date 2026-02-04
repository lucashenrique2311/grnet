# GRNet App

Aplicativo móvel para GRNet Bahia - Segunda via de boletos e serviços.

## 🚀 Funcionalidades

- **Segunda Via de Boletos**: Consulta por CPF/CNPJ
- **Lista de Contratos**: Visualização organizada
- **Geração de Segunda Via**: Com cópia de PIX e linha digitável
- **Teste de Velocidade**: Integração com Speedtest
- **Contatos**: Informações de atendimento
- **Cobertura**: Área de atendimento

## 📱 Tecnologias

- React Native
- Expo SDK 53
- React Native Mask Text
- React Native WebView

## 🛠️ Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd grnet

# Instale as dependências
npm install

# Instale o EAS CLI globalmente
sudo npm install -g eas-cli

# Faça login no EAS
eas login
```

## 🔧 Desenvolvimento

```bash
# Inicie o app em modo desenvolvimento
npm start

# Para Android
npm run android

# Para iOS
npm run ios

# Para Web
npm run web
```

## 🏗️ Build

### Preview (APK)
```bash
# Gera APK para teste
npm run build:preview
# ou
eas build --platform android --profile preview
```

### Production (AAB)
```bash
# Gera AAB para Google Play Store
npm run build:production
# ou
eas build --platform android --profile production
```

### iOS
```bash
# Gera build para iOS
npm run build:ios
# ou
eas build --platform ios --profile production
```

## 📋 Configurações

### app.json
- **Nome**: GRNet
- **Bundle ID**: com.grnet.grnetapp
- **Versão**: 1.0.0
- **Orientação**: Portrait

### eas.json
- **Preview**: APK para testes
- **Production**: AAB para loja
- **Development**: Cliente de desenvolvimento

## 🎨 Assets

- **Icon**: `./assets/icon.png` (1024x1024)
- **Adaptive Icon**: `./assets/adaptive-icon.png` (1024x1024)
- **Splash**: `./assets/splash-icon.png` (1242x2436)
- **Logo**: `./assets/logosemfundo.png`

## 📱 Permissões Android

- `INTERNET`: Acesso à internet
- `ACCESS_NETWORK_STATE`: Status da rede

## 🔐 API

- **Base URL**: https://sistema.grtelecomba.com.br/api/
- **Endpoints**:
  - `/ura/consultacliente/`: Consulta de contratos
  - `/ura/fatura2via/`: Geração de segunda via

## 🚀 Deploy

### Google Play Store
1. Execute `npm run build:production`
2. Faça upload do AAB gerado
3. Configure as informações da loja

### TestFlight (iOS)
1. Execute `npm run build:ios`
2. Faça upload via App Store Connect

## 📊 Monitoramento

- **EAS Dashboard**: https://expo.dev/accounts/lucassilva2311/projects/grnet
- **Builds**: Acompanhe o status dos builds
- **Logs**: Visualize logs de erro e performance

## 🐛 Troubleshooting

### Build falha
```bash
# Limpe o cache
expo r -c

# Verifique as dependências
npm install

# Reconfigure o EAS
eas build:configure
```

### CPF inválido
- O app aceita CPFs com 11 dígitos
- Validação matemática desabilitada para flexibilidade
- Logs detalhados no console para debug

## 📞 Suporte

- **Desenvolvedor**: Lucas Silva
- **Empresa**: GRNet Bahia
- **Contato**: (71) 4102-3977

## 📄 Licença

Proprietário - GRNet Bahia 