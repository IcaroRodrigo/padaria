import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  // ─── CHÁS E ERVAS ───────────────────────────────────────────────────────────
  { name: 'Chá de Camomila', category: 'Chás e Ervas', unit: 'g', costPrice: 7.00, salePrice: 14.90, description: 'Flores de camomila secas, ação calmante e digestiva. Embalagem 30g.' },
  { name: 'Chá de Erva-Cidreira', category: 'Chás e Ervas', unit: 'g', costPrice: 5.50, salePrice: 11.90, description: 'Erva-cidreira seca, levemente sedativa e digestiva. Embalagem 30g.' },
  { name: 'Chá de Hortelã', category: 'Chás e Ervas', unit: 'g', costPrice: 5.00, salePrice: 10.90, description: 'Folhas de hortelã secas, refrescantes e digestivas. Embalagem 25g.' },
  { name: 'Chá de Boldo', category: 'Chás e Ervas', unit: 'g', costPrice: 6.00, salePrice: 12.90, description: 'Folhas de boldo-do-chile, excelente para o fígado e digestão. Embalagem 30g.' },
  { name: 'Chá de Hibisco', category: 'Chás e Ervas', unit: 'g', costPrice: 9.00, salePrice: 18.90, description: 'Flores de hibisco secas, ricas em antioxidantes, auxilia no colesterol e pressão arterial. Embalagem 50g.' },
  { name: 'Chá Verde', category: 'Chás e Ervas', unit: 'g', costPrice: 12.00, salePrice: 24.90, description: 'Chá verde em folhas, antioxidante e termogênico natural. Embalagem 50g.' },
  { name: 'Chá de Gengibre', category: 'Chás e Ervas', unit: 'g', costPrice: 7.50, salePrice: 15.90, description: 'Gengibre desidratado em pedaços, anti-inflamatório e digestivo. Embalagem 40g.' },
  { name: 'Chá de Melissa', category: 'Chás e Ervas', unit: 'g', costPrice: 8.00, salePrice: 16.90, description: 'Folhas de melissa secas, calmante natural, auxilia no sono e ansiedade. Embalagem 30g.' },
  { name: 'Chá de Capim-Limão', category: 'Chás e Ervas', unit: 'g', costPrice: 5.50, salePrice: 11.90, description: 'Capim-limão seco, sabor cítrico suave, digestivo e calmante. Embalagem 30g.' },
  { name: 'Chá de Erva-Doce', category: 'Chás e Ervas', unit: 'g', costPrice: 6.00, salePrice: 12.90, description: 'Sementes de erva-doce, alivia gases e cólicas. Embalagem 50g.' },
  { name: 'Chá de Cavalinha', category: 'Chás e Ervas', unit: 'g', costPrice: 7.00, salePrice: 14.90, description: 'Cavalinha seca, diurético natural e fortalecedor de cabelos e unhas. Embalagem 30g.' },
  { name: 'Chá de Espinheira-Santa', category: 'Chás e Ervas', unit: 'g', costPrice: 8.00, salePrice: 16.90, description: 'Folhas de espinheira-santa, auxilia na gastrite e úlcera. Embalagem 30g.' },
  { name: 'Chá de Guaco', category: 'Chás e Ervas', unit: 'g', costPrice: 6.50, salePrice: 13.90, description: 'Folhas de guaco, broncodilatador natural, indicado para tosse e gripe. Embalagem 30g.' },
  { name: 'Chá de Alcaçuz', category: 'Chás e Ervas', unit: 'g', costPrice: 9.00, salePrice: 18.90, description: 'Raiz de alcaçuz, anti-inflamatório e expectorante natural. Embalagem 40g.' },
  { name: 'Chá de Erva-Mate', category: 'Chás e Ervas', unit: 'g', costPrice: 8.00, salePrice: 15.90, description: 'Erva-mate tostada em folhas, estimulante natural e rico em antioxidantes. Embalagem 100g.' },

  // ─── GRÃOS E CEREAIS ────────────────────────────────────────────────────────
  { name: 'Arroz Integral', category: 'Grãos e Cereais', unit: 'kg', costPrice: 6.50, salePrice: 12.90, description: 'Arroz integral orgânico, rico em fibras e nutrientes. Vendido a granel.' },
  { name: 'Feijão Preto', category: 'Grãos e Cereais', unit: 'kg', costPrice: 7.00, salePrice: 13.90, description: 'Feijão preto selecionado, rico em proteínas e ferro. Vendido a granel.' },
  { name: 'Feijão Carioca', category: 'Grãos e Cereais', unit: 'kg', costPrice: 6.50, salePrice: 12.90, description: 'Feijão carioca selecionado, o mais consumido no Brasil. Vendido a granel.' },
  { name: 'Lentilha', category: 'Grãos e Cereais', unit: 'kg', costPrice: 9.00, salePrice: 18.90, description: 'Lentilha verde, rica em proteínas e ferro, ótima para sopas e saladas.' },
  { name: 'Grão-de-Bico', category: 'Grãos e Cereais', unit: 'kg', costPrice: 10.00, salePrice: 19.90, description: 'Grão-de-bico selecionado, base do homus, rico em proteínas vegetais.' },
  { name: 'Quinoa em Grão', category: 'Grãos e Cereais', unit: 'kg', costPrice: 28.00, salePrice: 54.90, description: 'Quinoa real boliviana, proteína completa com todos os aminoácidos essenciais.' },
  { name: 'Aveia em Flocos Grossos', category: 'Grãos e Cereais', unit: 'kg', costPrice: 8.00, salePrice: 15.90, description: 'Aveia em flocos grossos, rica em betaglucanas e fibras solúveis.' },
  { name: 'Aveia em Flocos Finos', category: 'Grãos e Cereais', unit: 'kg', costPrice: 8.00, salePrice: 15.90, description: 'Aveia em flocos finos, ideal para mingau e receitas rápidas.' },
  { name: 'Milho para Pipoca', category: 'Grãos e Cereais', unit: 'kg', costPrice: 5.00, salePrice: 9.90, description: 'Milho de pipoca selecionado, sem agrotóxicos. Vendido a granel.' },
  { name: 'Cevada em Grão', category: 'Grãos e Cereais', unit: 'kg', costPrice: 7.00, salePrice: 14.90, description: 'Cevada perlada, rica em fibras e betaglucanas, ótima para sopas.' },
  { name: 'Centeio em Grão', category: 'Grãos e Cereais', unit: 'kg', costPrice: 9.00, salePrice: 17.90, description: 'Centeio em grão, base para pães integrais e fermentações.' },
  { name: 'Amaranto em Grão', category: 'Grãos e Cereais', unit: 'kg', costPrice: 22.00, salePrice: 42.90, description: 'Amaranto em grão, sem glúten, rico em cálcio e lisina.' },
  { name: 'Feijão Fradinho', category: 'Grãos e Cereais', unit: 'kg', costPrice: 8.00, salePrice: 15.90, description: 'Feijão fradinho (caupi), base do acarajé, rico em proteínas.' },
  { name: 'Ervilha Seca Partida', category: 'Grãos e Cereais', unit: 'kg', costPrice: 8.50, salePrice: 16.90, description: 'Ervilha seca partida, rica em proteínas e fibras, ótima para sopas.' },

  // ─── SUPLEMENTOS ────────────────────────────────────────────────────────────
  { name: 'Spirulina em Pó', category: 'Suplementos', unit: 'g', costPrice: 35.00, salePrice: 64.90, description: 'Spirulina em pó, microalga rica em proteínas, vitaminas e minerais. Embalagem 100g.' },
  { name: 'Clorela em Pó', category: 'Suplementos', unit: 'g', costPrice: 32.00, salePrice: 59.90, description: 'Clorela em pó, alga detox rica em clorofila. Embalagem 100g.' },
  { name: 'Maca Peruana em Pó', category: 'Suplementos', unit: 'g', costPrice: 28.00, salePrice: 54.90, description: 'Maca peruana em pó, adaptógeno natural, melhora energia e libido. Embalagem 100g.' },
  { name: 'Cúrcuma em Pó', category: 'Suplementos', unit: 'g', costPrice: 18.00, salePrice: 34.90, description: 'Cúrcuma (açafrão-da-terra) em pó, potente anti-inflamatório natural. Embalagem 100g.' },
  { name: 'Ashwagandha em Pó', category: 'Suplementos', unit: 'g', costPrice: 38.00, salePrice: 72.90, description: 'Ashwagandha (Withania somnifera) em pó, adaptógeno anti-estresse. Embalagem 100g.' },
  { name: 'Própolis em Pó', category: 'Suplementos', unit: 'g', costPrice: 30.00, salePrice: 58.90, description: 'Extrato de própolis em pó, antibacteriano e imunológico natural. Embalagem 50g.' },
  { name: 'Gelatina Natural', category: 'Suplementos', unit: 'g', costPrice: 15.00, salePrice: 28.90, description: 'Gelatina natural sem sabor, rica em colágeno, boa para articulações e pele. Embalagem 200g.' },
  { name: 'Colágeno Hidrolisado', category: 'Suplementos', unit: 'g', costPrice: 40.00, salePrice: 74.90, description: 'Colágeno hidrolisado em pó, para pele, cabelos, unhas e articulações. Embalagem 200g.' },
  { name: 'Pólen de Abelha', category: 'Suplementos', unit: 'g', costPrice: 35.00, salePrice: 65.90, description: 'Pólen apícola desidratado, multivitamínico natural completo. Embalagem 100g.' },
  { name: 'Geleia Real', category: 'Suplementos', unit: 'g', costPrice: 55.00, salePrice: 99.90, description: 'Geleia real liofilizada, revigorante e imunológico. Embalagem 10g.' },

  // ─── TEMPEROS E ESPECIARIAS ──────────────────────────────────────────────────
  { name: 'Pimenta-do-Reino Preta', category: 'Temperos e Especiarias', unit: 'g', costPrice: 12.00, salePrice: 22.90, description: 'Pimenta-do-reino preta em grãos, aroma intenso e sabor picante. Embalagem 100g.' },
  { name: 'Pimenta-do-Reino Branca', category: 'Temperos e Especiarias', unit: 'g', costPrice: 14.00, salePrice: 26.90, description: 'Pimenta-do-reino branca em grãos, sabor mais suave. Embalagem 100g.' },
  { name: 'Canela em Pau', category: 'Temperos e Especiarias', unit: 'g', costPrice: 10.00, salePrice: 19.90, description: 'Canela-do-ceilão em pau, aroma suave e adocicado. Embalagem 50g.' },
  { name: 'Canela em Pó', category: 'Temperos e Especiarias', unit: 'g', costPrice: 10.00, salePrice: 19.90, description: 'Canela em pó fina, ideal para receitas doces e bebidas. Embalagem 100g.' },
  { name: 'Cravo-da-Índia', category: 'Temperos e Especiarias', unit: 'g', costPrice: 15.00, salePrice: 28.90, description: 'Cravo-da-índia inteiro, aroma marcante, antisséptico natural. Embalagem 50g.' },
  { name: 'Cardamomo em Grão', category: 'Temperos e Especiarias', unit: 'g', costPrice: 35.00, salePrice: 64.90, description: 'Cardamomo verde em vagens, especiaria aromática nobre. Embalagem 50g.' },
  { name: 'Cúrcuma em Pó (Tempero)', category: 'Temperos e Especiarias', unit: 'g', costPrice: 10.00, salePrice: 19.90, description: 'Açafrão-da-terra em pó, corante natural e anti-inflamatório. Embalagem 100g.' },
  { name: 'Páprica Doce', category: 'Temperos e Especiarias', unit: 'g', costPrice: 12.00, salePrice: 22.90, description: 'Páprica doce em pó, sabor suave e cor avermelhada intensa. Embalagem 100g.' },
  { name: 'Páprica Defumada', category: 'Temperos e Especiarias', unit: 'g', costPrice: 14.00, salePrice: 26.90, description: 'Páprica defumada em pó, aroma amadeirado, ideal para carnes. Embalagem 100g.' },
  { name: 'Cominho em Grão', category: 'Temperos e Especiarias', unit: 'g', costPrice: 11.00, salePrice: 21.90, description: 'Cominho inteiro em grão, aroma terroso e sabor quente. Embalagem 100g.' },
  { name: 'Orégano Desidratado', category: 'Temperos e Especiarias', unit: 'g', costPrice: 8.00, salePrice: 15.90, description: 'Orégano desidratado, aroma intenso, clássico da culinária italiana. Embalagem 50g.' },
  { name: 'Alecrim Desidratado', category: 'Temperos e Especiarias', unit: 'g', costPrice: 8.00, salePrice: 15.90, description: 'Alecrim desidratado, aroma resinoso, ótimo para carnes e batatas. Embalagem 30g.' },
  { name: 'Manjericão Desidratado', category: 'Temperos e Especiarias', unit: 'g', costPrice: 8.00, salePrice: 15.90, description: 'Manjericão desidratado, aroma fresco e levemente adocicado. Embalagem 30g.' },
  { name: 'Tomilho Desidratado', category: 'Temperos e Especiarias', unit: 'g', costPrice: 9.00, salePrice: 17.90, description: 'Tomilho desidratado, aroma herbáceo, ideal para sopas e ensopados. Embalagem 30g.' },
  { name: 'Curry em Pó', category: 'Temperos e Especiarias', unit: 'g', costPrice: 14.00, salePrice: 26.90, description: 'Blend de especiarias para curry, sabor marcante e picante. Embalagem 100g.' },
  { name: 'Noz-Moscada Inteira', category: 'Temperos e Especiarias', unit: 'g', costPrice: 20.00, salePrice: 38.90, description: 'Noz-moscada inteira, aroma quente e adocicado. Embalagem 30g.' },
  { name: 'Sal Rosa do Himalaia', category: 'Temperos e Especiarias', unit: 'g', costPrice: 10.00, salePrice: 19.90, description: 'Sal rosa do Himalaia em cristais, rico em minerais, sem refino. Embalagem 500g.' },
  { name: 'Sal Marinho', category: 'Temperos e Especiarias', unit: 'kg', costPrice: 5.00, salePrice: 9.90, description: 'Sal marinho sem refino, com minerais naturais preservados.' },

  // ─── ÓLEOS E VINAGRES ────────────────────────────────────────────────────────
  { name: 'Óleo de Coco Extra Virgem', category: 'Óleos e Vinagres', unit: 'ml', costPrice: 22.00, salePrice: 42.90, description: 'Óleo de coco extra virgem prensado a frio, 200ml. Rico em ácido láurico.' },
  { name: 'Azeite de Oliva Extra Virgem', category: 'Óleos e Vinagres', unit: 'ml', costPrice: 30.00, salePrice: 58.90, description: 'Azeite de oliva extra virgem, acidez abaixo de 0,5%, 250ml.' },
  { name: 'Óleo de Gergelim', category: 'Óleos e Vinagres', unit: 'ml', costPrice: 18.00, salePrice: 34.90, description: 'Óleo de gergelim torrado, sabor intenso para finalizar pratos asiáticos. 100ml.' },
  { name: 'Óleo de Linhaça', category: 'Óleos e Vinagres', unit: 'ml', costPrice: 20.00, salePrice: 38.90, description: 'Óleo de linhaça prensado a frio, rico em ômega-3. 100ml. Refrigerar após abrir.' },
  { name: 'Vinagre de Maçã Orgânico', category: 'Óleos e Vinagres', unit: 'ml', costPrice: 12.00, salePrice: 24.90, description: 'Vinagre de maçã orgânico com a mãe, auxilia na digestão. 500ml.' },
  { name: 'Óleo de Abacate', category: 'Óleos e Vinagres', unit: 'ml', costPrice: 28.00, salePrice: 54.90, description: 'Óleo de abacate extra virgem prensado a frio, alto ponto de fumaça. 200ml.' },

  // ─── FARINHAS E AMIDOS ───────────────────────────────────────────────────────
  { name: 'Farinha de Aveia', category: 'Farinhas e Amidos', unit: 'kg', costPrice: 9.00, salePrice: 17.90, description: 'Farinha de aveia integral, sem glúten por natureza, rica em fibras.' },
  { name: 'Farinha de Amêndoas', category: 'Farinhas e Amidos', unit: 'kg', costPrice: 55.00, salePrice: 99.90, description: 'Farinha de amêndoas fina, sem glúten, base de confeitaria low carb.' },
  { name: 'Farinha de Coco', category: 'Farinhas e Amidos', unit: 'kg', costPrice: 25.00, salePrice: 48.90, description: 'Farinha de coco desidratada, sem glúten, rica em fibras e gorduras boas.' },
  { name: 'Farinha de Grão-de-Bico', category: 'Farinhas e Amidos', unit: 'kg', costPrice: 14.00, salePrice: 27.90, description: 'Farinha de grão-de-bico, sem glúten, rica em proteínas vegetais.' },
  { name: 'Farinha de Arroz', category: 'Farinhas e Amidos', unit: 'kg', costPrice: 8.00, salePrice: 15.90, description: 'Farinha de arroz fina, sem glúten, versátil para pães e bolos.' },
  { name: 'Farinha de Mandioca Torrada', category: 'Farinhas e Amidos', unit: 'kg', costPrice: 7.00, salePrice: 13.90, description: 'Farinha de mandioca torrada, farofa clássica brasileira.' },
  { name: 'Polvilho Azedo', category: 'Farinhas e Amidos', unit: 'kg', costPrice: 8.00, salePrice: 15.90, description: 'Polvilho azedo, base do pão de queijo e biscoito de polvilho.' },
  { name: 'Polvilho Doce', category: 'Farinhas e Amidos', unit: 'kg', costPrice: 7.50, salePrice: 14.90, description: 'Polvilho doce (amido de mandioca), sem glúten, espessante natural.' },
  { name: 'Fécula de Batata', category: 'Farinhas e Amidos', unit: 'kg', costPrice: 10.00, salePrice: 19.90, description: 'Fécula de batata, espessante sem glúten, suave para receitas.' },
  { name: 'Farinha de Linhaça Dourada', category: 'Farinhas e Amidos', unit: 'kg', costPrice: 15.00, salePrice: 28.90, description: 'Farinha de linhaça dourada, rica em ômega-3 e fibras.' },

  // ─── SEMENTES ────────────────────────────────────────────────────────────────
  { name: 'Linhaça Dourada', category: 'Sementes', unit: 'kg', costPrice: 10.00, salePrice: 19.90, description: 'Sementes de linhaça dourada, ricas em ômega-3 e lignanas.' },
  { name: 'Linhaça Marrom', category: 'Sementes', unit: 'kg', costPrice: 8.00, salePrice: 15.90, description: 'Sementes de linhaça marrom, fonte de ômega-3 e fibras.' },
  { name: 'Chia', category: 'Sementes', unit: 'kg', costPrice: 18.00, salePrice: 34.90, description: 'Sementes de chia, ricas em ômega-3, fibras e proteínas. Formam gel com água.' },
  { name: 'Gergelim Branco', category: 'Sementes', unit: 'kg', costPrice: 12.00, salePrice: 23.90, description: 'Sementes de gergelim branco sem casca, ricas em cálcio.' },
  { name: 'Gergelim Preto', category: 'Sementes', unit: 'kg', costPrice: 14.00, salePrice: 26.90, description: 'Sementes de gergelim preto com casca, maior concentração de antioxidantes.' },
  { name: 'Girassol Sem Casca', category: 'Sementes', unit: 'kg', costPrice: 14.00, salePrice: 26.90, description: 'Sementes de girassol sem casca, ricas em vitamina E e ômega-6.' },
  { name: 'Abóbora Sem Casca', category: 'Sementes', unit: 'kg', costPrice: 22.00, salePrice: 42.90, description: 'Sementes de abóbora sem casca (pepitas), ricas em zinco e magnésio.' },
  { name: 'Cânhamo Descascado', category: 'Sementes', unit: 'kg', costPrice: 55.00, salePrice: 99.90, description: 'Sementes de cânhamo descascadas (hemp hearts), proteína vegetal completa.' },
  { name: 'Semente de Caju', category: 'Sementes', unit: 'kg', costPrice: 38.00, salePrice: 72.90, description: 'Castanha de caju inteira, rica em gorduras boas e proteínas.' },

  // ─── FRUTAS SECAS ────────────────────────────────────────────────────────────
  { name: 'Uva Passa Preta', category: 'Frutas Secas', unit: 'kg', costPrice: 18.00, salePrice: 34.90, description: 'Uva passa preta sem sementes, naturalmente adocicada, rica em ferro.' },
  { name: 'Uva Passa Dourada', category: 'Frutas Secas', unit: 'kg', costPrice: 20.00, salePrice: 38.90, description: 'Uva passa dourada (sultana), mais suave e clara que a preta.' },
  { name: 'Tâmara Medjool', category: 'Frutas Secas', unit: 'kg', costPrice: 45.00, salePrice: 84.90, description: 'Tâmara medjool fresca, carnuda e adocicada, substitui o açúcar em receitas.' },
  { name: 'Damasco Turco', category: 'Frutas Secas', unit: 'kg', costPrice: 28.00, salePrice: 54.90, description: 'Damasco seco sem sulfito, rico em beta-caroteno e ferro.' },
  { name: 'Ameixa Seca', category: 'Frutas Secas', unit: 'kg', costPrice: 22.00, salePrice: 42.90, description: 'Ameixa seca sem caroço, excelente para o trânsito intestinal.' },
  { name: 'Cranberry Desidratado', category: 'Frutas Secas', unit: 'kg', costPrice: 40.00, salePrice: 74.90, description: 'Cranberry desidratado, antioxidante e protetor do trato urinário.' },
  { name: 'Nozes', category: 'Frutas Secas', unit: 'kg', costPrice: 55.00, salePrice: 99.90, description: 'Nozes inteiras sem casca, ricas em ômega-3 e vitamina E.' },
  { name: 'Castanha-do-Pará', category: 'Frutas Secas', unit: 'kg', costPrice: 30.00, salePrice: 58.90, description: 'Castanha-do-pará (castanha-do-brasil), maior fonte alimentar de selênio.' },
  { name: 'Amêndoas', category: 'Frutas Secas', unit: 'kg', costPrice: 50.00, salePrice: 94.90, description: 'Amêndoas cruas sem casca, ricas em vitamina E e magnésio.' },
  { name: 'Avelã', category: 'Frutas Secas', unit: 'kg', costPrice: 60.00, salePrice: 114.90, description: 'Avelã sem casca, rica em vitamina E e gorduras monoinsaturadas.' },
  { name: 'Pistache', category: 'Frutas Secas', unit: 'kg', costPrice: 65.00, salePrice: 124.90, description: 'Pistache sem casca e sem sal, rico em proteínas e antioxidantes.' },
  { name: 'Mix de Oleaginosas', category: 'Frutas Secas', unit: 'kg', costPrice: 40.00, salePrice: 76.90, description: 'Mix de amêndoas, nozes, castanhas e avelãs, snack nutritivo completo.' },
  { name: 'Tâmara Deglet Nour', category: 'Frutas Secas', unit: 'kg', costPrice: 32.00, salePrice: 62.90, description: 'Tâmara seca argelina, mais firme, ideal para uso culinário.' },

  // ─── ADOÇANTES NATURAIS ──────────────────────────────────────────────────────
  { name: 'Mel Silvestre', category: 'Adoçantes Naturais', unit: 'ml', costPrice: 18.00, salePrice: 34.90, description: 'Mel silvestre puro artesanal, não aquecido, preserva enzimas e antioxidantes. 300g.' },
  { name: 'Mel de Abelha com Própolis', category: 'Adoçantes Naturais', unit: 'ml', costPrice: 22.00, salePrice: 42.90, description: 'Mel com extrato de própolis, antibacteriano e imunológico. 300g.' },
  { name: 'Açúcar de Coco', category: 'Adoçantes Naturais', unit: 'kg', costPrice: 22.00, salePrice: 42.90, description: 'Açúcar de coco, baixo índice glicêmico, substituto natural do açúcar refinado.' },
  { name: 'Melado de Cana', category: 'Adoçantes Naturais', unit: 'ml', costPrice: 12.00, salePrice: 22.90, description: 'Melado de cana orgânico, rico em ferro e cálcio. 300ml.' },
  { name: 'Rapadura', category: 'Adoçantes Naturais', unit: 'kg', costPrice: 8.00, salePrice: 15.90, description: 'Rapadura tradicional nordestina, açúcar integral não refinado, rico em minerais.' },
  { name: 'Estévia em Pó', category: 'Adoçantes Naturais', unit: 'g', costPrice: 25.00, salePrice: 48.90, description: 'Estévia em pó (extrato de stevia), adoçante zero calorias. Embalagem 50g.' },
  { name: 'Xarope de Agave', category: 'Adoçantes Naturais', unit: 'ml', costPrice: 18.00, salePrice: 34.90, description: 'Xarope de agave orgânico, substituto do mel para veganos. 250ml.' },
  { name: 'Açúcar Mascavo', category: 'Adoçantes Naturais', unit: 'kg', costPrice: 8.50, salePrice: 16.90, description: 'Açúcar mascavo orgânico, não refinado, rico em melaço e minerais.' },

  // ─── COSMÉTICOS NATURAIS ─────────────────────────────────────────────────────
  { name: 'Argila Verde', category: 'Cosméticos Naturais', unit: 'g', costPrice: 8.00, salePrice: 15.90, description: 'Argila verde em pó, adsorvente, ideal para máscaras faciais e cabelos. Embalagem 100g.' },
  { name: 'Argila Branca', category: 'Cosméticos Naturais', unit: 'g', costPrice: 8.00, salePrice: 15.90, description: 'Argila branca (caulim) em pó, suave para peles sensíveis. Embalagem 100g.' },
  { name: 'Argila Rosa', category: 'Cosméticos Naturais', unit: 'g', costPrice: 10.00, salePrice: 19.90, description: 'Argila rosa em pó, mistura de argilas branca e vermelha, equilibrante. Embalagem 100g.' },
  { name: 'Manteiga de Karité', category: 'Cosméticos Naturais', unit: 'g', costPrice: 20.00, salePrice: 38.90, description: 'Manteiga de karité pura (shea butter), hidratante intensiva para pele e cabelos. Embalagem 100g.' },
  { name: 'Manteiga de Cacau', category: 'Cosméticos Naturais', unit: 'g', costPrice: 18.00, salePrice: 34.90, description: 'Manteiga de cacau pura, hidratante e protetora, aroma característico. Embalagem 100g.' },
  { name: 'Óleo de Rícino', category: 'Cosméticos Naturais', unit: 'ml', costPrice: 10.00, salePrice: 19.90, description: 'Óleo de mamona (rícino) puro, estimula crescimento de cabelos e sobrancelhas. 100ml.' },
  { name: 'Óleo de Argan', category: 'Cosméticos Naturais', unit: 'ml', costPrice: 35.00, salePrice: 65.90, description: 'Óleo de argan puro marroquino, ouro líquido para cabelos e pele. 30ml.' },
  { name: 'Bicarbonato de Sódio', category: 'Cosméticos Naturais', unit: 'g', costPrice: 5.00, salePrice: 9.90, description: 'Bicarbonato de sódio puro alimentar, multiuso: culinária, limpeza e higiene. Embalagem 500g.' },
];

async function main() {
  console.log('Inserindo produtos...');

  const categoryMap = new Map<string, number>();
  const categories = await prisma.category.findMany();
  for (const c of categories) {
    categoryMap.set(c.name, c.id);
  }

  const maxPluProduct = await prisma.product.findFirst({
    where: { plu: { not: null } },
    orderBy: { plu: 'desc' },
    select: { plu: true },
  });
  let nextPlu = (maxPluProduct?.plu ?? 0) + 1;

  let inserted = 0;
  let skipped = 0;

  for (const p of products) {
    const categoryId = categoryMap.get(p.category);
    if (!categoryId) {
      console.warn(`  ⚠ Categoria não encontrada: ${p.category}`);
      skipped++;
      continue;
    }

    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        categoryId,
        unit: p.unit,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
        plu: nextPlu++,
        active: true,
      },
    });
    inserted++;
    process.stdout.write(`  ✓ [PLU ${nextPlu - 1}] ${p.name}\n`);
  }

  console.log(`\n✅ ${inserted} produtos inseridos, ${skipped} ignorados.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
