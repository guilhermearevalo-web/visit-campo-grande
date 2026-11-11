# Visit Campo Grande

implemente e deixa o Nome ''VISIT CAMPO GRANDE'' tem dúvidas? faça o passo a passo de implementação e siga conforme pedido: # MASTER PROMPT — PASSAPORTE DIGITAL TURÍSTICO: CAMPO GRANDE - MS
(Arquitetura SaaS Multi-Destino, Mobile-First PWA, Supabase com RLS, GPS Geofencing e QR Code)
Você é um Engenheiro de Software Sênior construindo a plataforma oficial do **Passaporte Digital Turístico de Campo Grande - MS**. A plataforma deve ser uma aplicação web moderna (React + Tailwind CSS + Vite + TypeScript + Supabase), responsiva (mobile-first), com painel administrativo integrado, catálogo de atrativos turísticos, validação de visitas por QR Code e Geolocalização, sistema de conquistas/recompensas com vouchers e leitura de QR pelo parceiro comercial.
O primeiro destino oficial é **Campo Grande - MS**, mas a arquitetura de banco de dados e de front-end deve ser logicamente preparada para múltiplos destinos (coluna `destination_id` nas tabelas principais).
---
### 1. IDENTIDADE VISUAL E DESIGN SYSTEM
- **Tema:** Turismo vibrante, moderno e acolhedor, refletindo a "Cidade Morena" (Campo Grande).
- **Cores principais:**
  - Primária: Terracota moderno / Laranja pôr do sol pantaneiro (`#E05326` a `#D946EF` gradientes quentes).
  - Secundária / Acento: Verde Parques e Ipês (`#059669` / `#10B981`).
  - Fundo & Superfície: Modo claro limpo (`#F8FAFC` a `#FFFFFF`), com suporte refinado a modo escuro (`#0F172A`).
- **Estilo:** Cards com cantos arredondados (`rounded-2xl`), sombras suaves (`shadow-sm` a `shadow-md`), tipografia legível e moderna (estilo Plus Jakarta Sans / Inter), ícones intuitivos (Lucide React).
- **Sem dados fictícios com aparência de erro:** Em caso de listas vazias, exibir empty states elegantes com botões de ação ("Cadastre o primeiro atrativo").
---
### 2. ESTRUTURA DO BANCO DE DADOS (SUPABASE COM RLS)
Crie as migrações SQL completas com RLS (Row Level Security) ativado e funções `SECURITY DEFINER`:
1. **destinations** (suporte multi-destino):
   - `id` (uuid, pk), `name` ("Campo Grande"), `slug` ("campo-grande"), `state` ("MS"), `logo_url`, `banner_url`, `primary_color`, `active` (boolean default true).
2. **attractions** (atrativos turísticos / checkpoints):
   - `id` (uuid, pk), `destination_id` (fk destinations), `name`, `slug`, `category` ('parque', 'cultural', 'gastronomia', 'historico', 'feira', 'museu', 'natureza', 'outro'), `description`, `history`, `cover_image_url`, `gallery_urls` (text[]), `address`, `latitude` (numeric), `longitude` (numeric), `geofence_radius_meters` (int, default 150), `validation_mode` ('geofence', 'code', 'both'), `partner_code` (text, código alfanumérico de 6 dígitos para validação manual/contingência), `qr_code_token` (uuid único), `points_reward` (int default 10), `requires_photo` (boolean default false), `opening_hours`, `contact_phone`, `instagram`, `website`, `is_passport_active` (boolean default true), `order_sequence` (int), `created_at`.
3. **profiles** (visitantes, parceiros e gestores):
   - `id` (uuid, pk references auth.users), `full_name`, `email`, `avatar_url`, `city_origin`, `state_origin`, `role` ('tourist', 'partner', 'manager', 'admin'), `created_at`.
4. **passport_checkins** (registros de visita):
   - `id` (uuid, pk), `user_id` (fk profiles), `attraction_id` (fk attractions), `destination_id` (fk destinations), `validation_type` ('geofence', 'qrcode', 'partner_code', 'manual_admin'), `created_at`.
   - Restrição única: `UNIQUE(user_id, attraction_id)` para impedir check-ins duplicados indevidos.
5. **commercial_partners** (estabelecimentos e empresas participantes):
   - `id` (uuid, pk), `destination_id` (fk destinations), `owner_id` (fk profiles opcional), `business_name`, `trade_name`, `category`, `logo_url`, `address`, `phone`, `email`, `status` ('pending', 'active', 'suspended'), `created_at`.
6. **rewards** (conquistas, benefícios e recompensas):
   - `id` (uuid, pk), `destination_id` (fk destinations), `partner_id` (fk commercial_partners opcional), `title`, `description`, `required_checkins_count` (int), `reward_type` ('discount', 'gift', 'badge', 'experience'), `discount_percentage` (int), `voucher_prefix` (text), `stock_limit` (int), `is_active` (boolean default true).
7. **user_vouchers** (vouchers gerados aos turistas):
   - `id` (uuid, pk), `user_id` (fk profiles), `reward_id` (fk rewards), `voucher_code` (ex: `MS1234CG-A1B2C3`), `qr_code_data`, `status` ('available', 'redeemed', 'expired'), `redeemed_at`, `redeemed_by_partner_id`, `created_at`.
---
### 3. SEED REAL DE CAMPO GRANDE (DADOS OFICIAIS DO BANCO)
Insira automaticamente no banco o destino inicial "Campo Grande" e os 9 atrativos oficiais com suas descrições completas, coordenadas exatas, raios de geofence e códigos de contingência:
**Destino:**
- Nome: `Campo Grande` | Slug: `campo-grande` | Estado: `MS`
**Atrativos Oficiais:**
1. **Parque das Nações Indígenas**
   - Categoria: `parque` | Ordem: 1 | Lat: `-20.4532` | Long: `-54.5826` | Raio GPS: `80m` | Modo: `geofence`
   - Descrição: Principal parque urbano da cidade, perfeito para caminhar entre áreas arborizadas, relaxar à beira do lago e observar de perto capivaras e aves no seu habitat natural.
2. **Museu das Culturas Dom Bosco**
   - Categoria: `museu` | Ordem: 2 | Lat: `-20.4545` | Long: `-54.5802` | Raio GPS: `500m` | Modo: `geofence`
   - Descrição: Localizado no Parque das Nações Indígenas, oferece uma imersão na cultura indígena e na biodiversidade do Centro-Oeste, com artefatos, fósseis e espécies do Pantanal.
3. **Bioparque Pantanal**
   - Categoria: `cultural` | Ordem: 3 | Lat: `-20.4560` | Long: `-54.5860` | Raio GPS: `92m` | Modo: `geofence`
   - Descrição: O maior aquário de água doce do mundo. Arquitetura icônica e tanques gigantes com peixes e ecossistemas pantaneiros.
4. **Mercadão Municipal Antônio Valente**
   - Categoria: `gastronomia` | Ordem: 4 | Lat: `-20.4632` | Long: `-54.6152` | Raio GPS: `500m` | Modo: `both` | Código: `BGYP77`
   - Descrição: Espaço gastronômico tradicional para almoçar pratos típicos como o famoso sobá, pastéis, caldos e comprar erva-mate de tereré e doces artesanais.
5. **Morada dos Baís**
   - Categoria: `historico` | Ordem: 5 | Lat: `-20.4618` | Long: `-54.6189` | Raio GPS: `500m` | Modo: `geofence`
   - Descrição: Patrimônio histórico do centro de Campo Grande com arquitetura marcante e memória ligada à pioneira artista plástica Lídia Baís.
6. **Casa do Artesão**
   - Categoria: `cultural` | Ordem: 6 | Lat: `-20.4628` | Long: `-54.6141` | Raio GPS: `500m` | Modo: `both` | Código: `IKLGOL`
   - Descrição: Espaço dedicado ao artesanato sul-mato-grossense, com peças originais em madeira, cerâmica kadiwéu e lembranças culturais da viagem.
7. **Praça Ary Coelho**
   - Categoria: `historico` | Ordem: 7 | Lat: `-20.4625` | Long: `-54.6128` | Raio GPS: `500m` | Modo: `geofence`
   - Descrição: O coração do centro comercial e histórico de Campo Grande, com arborização exuberante, chafariz e grande circulação cotidiana de moradores.
8. **Mirante da Orla Morena**
   - Categoria: `parque` | Ordem: 8 | Lat: `-20.4550` | Long: `-54.6300` | Raio GPS: `600m` | Modo: `geofence`
   - Descrição: Espaço arborizado ideal para caminhadas no fim da tarde, contemplação do pôr do sol e observação de aviões pousando no aeroporto.
9. **Feira Central de Campo Grande (Feirona)**
   - Categoria: `feira` | Ordem: 9 | Lat: `-20.4578` | Long: `-54.6183` | Raio GPS: `500m` | Modo: `both` | Código: `EWJEXG`
   - Descrição: O ponto noturno mais tradicional da cidade, famoso pelo sobá campo-grandense (patrimônio imaterial registrado), espetinhos com mandioca e cultura nipônica.
**Recompensa Inicial:**
- Título: `10% de Desconto na Cidade Morena`
- Descrição: `Recompensa especial desbloqueada ao concluir o Passaporte Digital de Campo Grande.`
- Requisito: Completar a rota (ou 8 visitas).
- Prefixo do Voucher: `MS1234CG` | Tipo: `discount` (10%) | Limite: `50` vouchers.
---
### 4. PRINCIPAIS MÓDULOS E TELAS DO SISTEMA
#### A. Experiência do Turista (Mobile-First / PWA)
- **Home do Visitante:** Saudação com nome do usuário, barra de progresso do passaporte (ex: "5 de 9 atrativos carimbados - 55%"), atalhos rápidos ("Escanear QR Code", "Ver Mapa", "Meus Vouchers").
- **Catálogo de Atrativos & Mapa:**
  - Visualização em lista (com filtros por categoria) e modo Mapa interativo.
  - Página individual do atrativo: fotos, história, horários, endereço, botão "Como Chegar" e botão **"Registrar Visita"**.
- **Validação de Visita (Dupla Modalidade):**
  - **Geolocalização (GPS):** Mede a distância via fórmula Haversine entre as coordenadas do visitante e do atrativo. Se estiver dentro do raio de tolerância (em metros), registra o check-in e exibe animação com efeito sonoro de carimbo.
  - **Leitor de QR Code / Token:** Lê o QR Code fixado no atrativo. Caso o visitante não tenha conta aberta, mostra a página do atrativo e convida a criar conta/entrar para validar o carimbo.
  - **Código de Contingência:** Opção de digitar o código de 6 dígitos do atrativo caso o GPS falhe.
- **Meu Passaporte:** Página visual estilo "caderneta de passaporte", exibindo os selos/carimbos coloridos conquistados e as silhuetas em cinza dos que faltam visitar, com botão de compartilhamento nas redes sociais.
- **Recompensas & Vouchers:** Lista de benefícios desbloqueados, botão para abrir o Voucher com código exclusivo e QR Code para apresentar no estabelecimento parceiro.
#### B. Área do Parceiro Comercial (Validador de Voucher)
- Interface objetiva para atendentes de restaurantes, hotéis e lojas parceiras.
- Leitor de QR Code integrado para escanear o voucher do turista e marcar como "Resgatado" instantaneamente, impedindo reutilização fraudulenta.
#### C. Painel Administrativo de Campo Grande (ADM)
- **Dashboard com Indicadores:**
  - Total de turistas registrados, total de visitas/check-ins.
  - Atrativos mais visitados e ranking de popularidade.
  - Gráfico temporal de visitas (hoje, 7 dias, 30 dias, mês, ano).
  - Proporção de check-ins por GPS vs. QR Code vs. Código.
- **Gestão de Atrativos:**
  - Cadastrar, editar e ativar/desativar atrativos.
  - Configurar raio de tolerância do GPS em metros.
  - Gerador de **Placa de QR Code pronta para impressão** (layout oficial com logo de Campo Grande, nome do local e QR Code).
- **Gestão de Recompensas e Parceiros:**
  - Controle de benefícios, metas de visitas e estoque de vouchers.
  - Botão **"Entregar a quem já concluiu"** para disparar vouchers retroativos a quem já cumpriu a meta.
- **Exportação de Relatórios:** Exportação completa de dados em CSV/Excel para relatórios da Secretaria Municipal de Turismo.
---
### 5. DIRETRIZES TÉCNICAS DE IMPLEMENTAÇÃO
- Código modular e escalável em TypeScript, Tailwind CSS e componentes shadcn/ui.
- Leitor de QR Code robusto via `html5-qrcode` configurado para ativar a câmera traseira do smartphone.
- Funções de concessão de vouchers e check-in devem ser seguras (PostgreSQL RPC `SECURITY DEFINER`) para evitar manipulação client-side.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://visit-campo-grande.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/cb282417-8b7a-4934-9329-bdffcc7d9be4).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
