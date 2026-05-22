import { Router } from 'express';
export const eventRoutes = Router();

// Mock event data for API
const mockEvents = [
  {
    id: '1',
    title: 'Obsidian Echoes',
    category: 'Techno',
    date: new Date(2024, 9, 24).toISOString(),
    location: { address: 'Cyber-Plaza Underground', lat: 35.6895, lng: 139.6917 },
    price: 0,
    capacity: 500,
    attendeesCount: 142,
    image: 'https://images.unsplash.com/photo-1574391884720-bbe374025828?auto=format&fit=crop&q=80',
    featuredLevel: 2
  },
  {
    id: '2',
    title: 'Monochrome Muse',
    category: 'Arts',
    date: new Date(2024, 9, 25).toISOString(),
    location: { address: 'Ginza Project Space', lat: 35.671, lng: 139.765 },
    price: 30,
    capacity: 50,
    attendeesCount: 15,
    image: 'https://images.unsplash.com/photo-1554188248-986adbb73be4?auto=format&fit=crop&q=80',
    featuredLevel: 1
  }
];

eventRoutes.get('/', (req, res) => {
  res.json({ success: true, data: mockEvents });
});

eventRoutes.get('/:id', (req, res) => {
  const event = mockEvents.find(e => e.id === req.params.id);
  if (event) {
    res.json({ success: true, data: event });
  } else {
    res.status(404).json({ success: false, error: { message: 'Event not found' } });
  }
});
