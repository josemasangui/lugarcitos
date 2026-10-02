import { AppState } from '../types';

export const INITIAL_DATA: AppState = {
  resenas: [
    {
      id: 'don-julio',
      titulo: 'Don Julio',
      ubicacion: 'Guatemala 4699, Palermo, Buenos Aires',
      lat: -34.5888,
      lng: -58.4239,
      resena: 'Una experiencia inigualable en el corazón de Palermo. La carne de pastura alcanza niveles memorables de terneza y sabor tras una maduración cuidadosa y un fuego magistral con maderas duras.\n\nAcompañada de una atención impecable y una cava monumental que respeta los mejores terroirs y viticultores de toda la Argentina. Las mollejas crujientes al limón y el bife de cuadril son paradas obligatorias.',
      calificaciones: {
        atencion: 5,
        comida: 5,
        bebida: 4.8,
        postre: 4.5,
        precio: 4,
        ambiente: 5
      },
      precio: 4,
      fotaPortada: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=1200',
      fecha: '2026-03-12',
      etiquetas: ['Parrilla', 'Carnes', 'Cava Histórica', 'Palermo'],
      platoInsignia: 'Mollejas crujientes al limón y Bife de Cuadril',
      ocasion: ['Festejo Especial', 'Sobremesa Larga', 'Con Amigos']
    },
    {
      id: 'el-preferido-de-palermo',
      titulo: 'El Preferido de Palermo',
      ubicacion: 'Jorge Luis Borges 2108, Palermo, Buenos Aires',
      lat: -34.5866,
      lng: -58.4243,
      resena: 'Un clásico bodegón de esquina con fachada carmín que rescata recetas tradicionales con vegetales de huerta orgánica y charcutería artesanal propia.\n\nLa milanesa de bife de chorizo frita en grasa de campo es probablemente una de las cumbres porteñas contemporáneas. No dejes de pedir los tomates reliquia en temporada ni los embutidos de la casa.',
      calificaciones: {
        atencion: 4.5,
        comida: 5,
        bebida: 4.5,
        postre: 4.2,
        precio: 3.5,
        ambiente: 4.8
      },
      precio: 3,
      fotaPortada: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=1200',
      fecha: '2026-02-28',
      etiquetas: ['Bodegón', 'Charcutería', 'Milanesas', 'Palermo'],
      platoInsignia: 'Milanesa de bife de chorizo a caballo y Tomates Reliquia',
      ocasion: ['Con Amigos', 'Cena Familiar', 'Al Paso']
    },
    {
      id: 'la-alacena-pastificio',
      titulo: 'La Alacena Pastificio',
      ubicacion: 'Gascón 1396, Palermo, Buenos Aires',
      lat: -34.5953,
      lng: -58.4208,
      resena: 'El reino de la pasta fresca estirada a mano por Julieta Oriolo. Salsas profundas que hierven a fuego lento, sándwiches en focaccia recién horneada y antipasti que honran el sur de Italia.\n\nLos cappelletti rellenos de ossobuco con fondo de cocción y manteca de salvia son una muestra cabal de devoción y técnica.',
      calificaciones: {
        atencion: 4.6,
        comida: 4.9,
        bebida: 4.3,
        postre: 4.7,
        precio: 3.5,
        ambiente: 4.5
      },
      precio: 3,
      fotaPortada: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281298?auto=format&fit=crop&q=80&w=1200',
      fecha: '2026-01-18',
      etiquetas: ['Pasta Fresca', 'Italiana', 'Focaccia', 'Antipasti'],
      platoInsignia: 'Cappelletti de ossobuco con manteca de salvia y Focaccia tibia',
      ocasion: ['Primera Cita', 'Sobremesa Larga']
    }
  ],
  recetas: [
    {
      id: 'pasta-cacio-e-pepe',
      titulo: 'Pasta Cacio e Pepe',
      descripcion: 'La quintaesencia de la cocina romana en tres ingredientes: Pecorino Romano genuino, pimienta negra en grano recién machacada al mortero y agua de cocción con almidón. Sencillez elevada a la máxima potencia gastronómica.',
      fotaPortada: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&q=80&w=1200',
      tiempo: '20 minutos',
      porciones: '2 personas',
      ingredientes: [
        '200g de tonnarelli o spaghetti trafilati al bronzo',
        '160g de Pecorino Romano DOP rallado fino',
        '2 cucharadas soperas de pimienta negra en grano',
        'Sal gruesa para el agua de cocción (moderada)'
      ],
      pasos: [
        'Tostar suavemente los granos de pimienta en una sartén seca para despertar sus aceites esenciales, luego machacarlos en un mortero.',
        'Hervir la pasta en abundante agua con poca sal para concentrar el almidón del agua de cocción.',
        'En un bol amplio, mezclar el pecorino rallado con pequeños cucharones de agua tibia de cocción de la pasta batiendo enérgicamente hasta formar una crema homogénea y sedosa.',
        'Volcar la pasta al dente directamente en la sartén con la pimienta, retirar del fuego y amalgamar con la crema de pecorino hasta lograr una emulsión brillante sin grumos.'
      ]
    },
    {
      id: 'focaccia-alta-hidratacion',
      titulo: 'Focaccia Genovesa de Alta Hidratación',
      descripcion: 'Corteza dorada y crujiente, miga aireada con grandes alvéolos perfumada con romero fresco silvestre, escamas de sal marina y un hilo generoso de aceite de oliva virgen extra.',
      fotaPortada: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?auto=format&fit=crop&q=80&w=1200',
      tiempo: '18 horas (fermentación lenta)',
      porciones: '1 placa grande',
      ingredientes: [
        '500g de harina de fuerza (000 o W300)',
        '400ml de agua fría (80% hidratación)',
        '3g de levadura seca o 9g fresca',
        '12g de sal fina marina',
        '50ml de aceite de oliva virgen extra',
        'Romero fresco y sal marina en escamas para la superficie'
      ],
      pasos: [
        'Mezclar harina, agua y levadura sin amasar intensamente hasta integrar. Dejar reposar 30 min (autólisis).',
        'Incorporar sal con un chorrito de agua y realizar 3 series de pliegues en el bol cada 30 minutos.',
        'Fermentar en frío en la heladera durante 16 a 24 horas.',
        'Verter en placa aceitada, dejar leudar 2 horas a temperatura ambiente hasta que duplique volumen y burbujee.',
        'Hundir los dedos con decisión para formar los hoyuelos característicos, rociar con salmuera ligera y oliva, y hornear a 230°C durante 22 minutos.'
      ]
    }
  ],
  pendientes: [
    {
      id: 'corte-comedor',
      nombre: 'Corte Comedor',
      direccion: 'Av. Olazábal 1391, Belgrano, Buenos Aires',
      lat: -34.5576,
      lng: -58.4503,
      descripcion: 'Proyecto de carnicería de barrio elevada a restaurante de culto por Santiago Garat. Especial interés en sus cortes dry-aged y charcutería.',
      categoria: 'Carnes & Charcutería'
    },
    {
      id: 'mengano-bodegon',
      nombre: 'Mengano Bodegón',
      direccion: 'Cabrera 5172, Palermo, Buenos Aires',
      lat: -34.5898,
      lng: -58.4312,
      descripcion: 'Versión refinada de la memoria gastronómica porteña de la mano del chef Facundo Kelemen. Muy recomendado el tartare sobre torta frita.',
      categoria: 'Bodegón Contemporáneo'
    },
    {
      id: 'anchoita',
      nombre: 'Anchoíta',
      direccion: 'Juan Ramírez de Velasco 1520, Chacarita, Buenos Aires',
      lat: -34.5901,
      lng: -58.4485,
      descripcion: 'Icono absoluto del barrio de Chacarita por Enrique Piñeyro. Pescados de río y mar, quesos artesanales y una carta de vinos prodigiosa.',
      categoria: 'Cocina de Producto'
    }
  ],
  config: {
    nombre: 'Lugarcitos',
    slogan: 'Sobre gustos hay algo escrito',
    ratingSymbol: '🍴',
    mapsApiKey: '',
    logoUrl: null
  },
  sobreNosotros: {
    activo: true,
    titulo: 'Nuestra Historia en Cada Sobremesa',
    subtitulo: 'Lugarcitos nació de la fascinación por los rincones donde la comida se sirve con alma, tiempo y respeto por el comensal.',
    fotoPortada: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1600',
    texto: `Creemos profundamente que los mejores recuerdos no se construyen frente a una pantalla, sino alrededor de una mesa compartida, entre el tintineo de copas, el aroma a pan recién horneado y esa charla que se estira sin mirar el reloj.\n\nLugarcitos es un diario culinario independiente, honesto y apasionado. Recorremos calles de barrio, bodegones históricos de esquina, fuegos humeantes y pequeños obradores de pasta para documentar aquello que hace latir a cada cocina. No nos interesan las tendencias pasajeras ni las modas de turno; buscamos el sabor con memoria, la calidez de un mozo de oficio y los platos que reconfortan el espíritu.\n\nCada reseña, cada receta rescatada y cada rincón pendiente es una invitación abierta a sentarse, respirar hondo y disfrutar de la buena sobremesa.`,
    fotos: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?auto=format&fit=crop&q=80&w=800'
    ]
  }
};
