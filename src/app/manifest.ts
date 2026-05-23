
import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'TechXera Campus Portal',
    short_name: 'TechXera',
    description: 'Management ecosystem for TechXera students and administrators.',
    start_url: '/',
    display: 'standalone',
    background_color: '#280905',
    theme_color: '#C3110C',
    icons: [
      {
        src: 'https://i.postimg.cc/MZg1CbGc/1441541546-(1)-Photoroom.png',
        sizes: 'any',
        type: 'image/png',
      }
    ]
  }
}
