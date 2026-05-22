
export interface MockEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  organizer: string;
  image: string;
  category: string;
  subCategory?: string;
  price: number;
  match?: string;
  live?: boolean;
}

export const MOCK_EVENTS_DATA: MockEvent[] = [
  {
    id: '1',
    title: 'Anime Expo: Buenos Aires',
    organizer: 'Otaku Soul Events',
    category: 'Anime',
    subCategory: 'Concurso',
    match: '98%',
    location: 'Centro Costa Salguero',
    date: '2026-10-24T10:00:00',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80',
    description: 'La convención de anime más grande de la ciudad. Concursos de cosplay, invitados internacionales y stands de merchandising exclusivo.',
    price: 5000,
    live: true,
  },
  {
    id: '2',
    title: 'K-Pop Random Dance',
    organizer: 'Hallyu BA',
    category: 'K-Pop',
    subCategory: 'Random Dance',
    match: '85%',
    location: 'Obelisco de Buenos Aires',
    date: '2026-10-25T16:00:00',
    image: 'https://images.unsplash.com/photo-1514525253344-991422748105?auto=format&fit=crop&q=80',
    description: '¡Veni a bailar los hits de tus grupos favoritos! Evento masivo al aire libre para todos los fans del K-Pop.',
    price: 0,
    live: false,
  },
  {
    id: '3',
    title: 'Torneo E-Sports Central',
    organizer: 'Pro Gaming Liga',
    category: 'Gaming',
    subCategory: 'Torneo',
    match: '72%',
    location: 'Estadio Obras',
    date: '2026-10-27T12:00:00',
    image: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80',
    description: 'Las finales regionales que estabas esperando. Vení a ver a los mejores equipos de Valorant y League of Legends en vivo.',
    price: 5000,
    live: false,
  },
  {
    id: '4',
    title: 'Workshop Cosplay Pro',
    organizer: 'Masters of Cosplay',
    category: 'Cosplay',
    subCategory: 'Taller',
    match: '94%',
    location: 'Palacio San Miguel',
    date: '2026-10-28T14:00:00',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80',
    description: 'Aprendé técnicas avanzadas de props y maquillaje con los mejores cosplayers del país. Cupos limitados.',
    price: 15000,
    live: true,
  },
  {
    id: '5',
    title: 'Neon Tokyo Underground',
    organizer: 'Neo-Circuit',
    category: 'Anime',
    subCategory: 'Manga',
    match: '90%',
    location: 'Distrito 4, Tokyo',
    date: '2026-10-24T22:00:00',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80',
    description: 'Experimenta el latido de Shinjuku en el corazón de la ciudad. Más de 50 vendedores, vaporwave en vivo y merch exclusivo.',
    price: 5000
  },
  {
    id: '6',
    title: 'Sartorial Night: Episodio II',
    organizer: 'Velvet Society',
    category: 'Feria',
    subCategory: 'Comercial',
    match: '75%',
    location: 'El Gran Atrio',
    date: '2026-10-26T20:00:00',
    image: 'https://images.unsplash.com/photo-1574391884720-bbe374025828?auto=format&fit=crop&q=80',
    description: 'Una noche de elegancia y moda vanguardista. Desfile seguido de networking privado.',
    price: 10000
  },
  {
    id: '7',
    title: 'Code & Coffee: Dev Huddle',
    organizer: 'Bit-By-Bit',
    category: 'Gaming',
    subCategory: 'Lanzamiento',
    match: '60%',
    location: 'Tech Hub B4',
    date: '2026-11-01T14:00:00',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80',
    description: 'Conéctate con desarrolladores locales. Charlas relámpago, talleres y cafeína de alto octanaje.',
    price: 0
  }
];
