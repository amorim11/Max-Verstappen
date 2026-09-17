import f32014 from '../assets/images/f3-2014.jpg'
import str102015 from '../assets/images/str10-2015.jpg'
import podium2016 from '../assets/images/podium-2016.jpg'
import perez2021 from '../assets/images/verstappen-perez-2021.jpg'
import grid2024 from '../assets/images/grid-2024.jpg'
import rb212025 from '../assets/images/rb21-2025.jpg'
import rb222026 from '../assets/images/rb22-china-2026.jpg'

// Big "centre" plates alternate with smaller "side" plates, as on the rail.
export const MILESTONES = [
  {
    year: '2014',
    frame: 'centre',
    src: f32014,
    creditKey: 'f3_2014',
    alt: 'Max Verstappen aos 16 anos, na F3 Europeia em Hockenheim, 2014',
    title: 'Do kart aos monopostos.',
    copy: 'Campeão mundial de kart aos 15 anos, o filho de Jos Verstappen pula para a F3 Europeia e vence 10 corridas em 2014.',
  },
  {
    year: '2015',
    frame: 'side',
    align: 'right',
    src: str102015,
    creditKey: 'str10_2015',
    alt: 'Toro Rosso STR10 de Max Verstappen no GP do Japão de 2015',
    title: 'O mais jovem.',
    copy: 'Estreia pela Toro Rosso na Austrália, aos 17 anos: o piloto mais jovem a largar e a pontuar na F1.',
  },
  {
    year: '2016',
    frame: 'centre',
    src: podium2016,
    creditKey: 'podium2016',
    alt: 'Pódio do GP da Malásia de 2016, com Verstappen, Ricciardo e Rosberg',
    title: 'Vitória na estreia.',
    copy: 'Promovido à Red Bull em plena temporada, vence o GP da Espanha na primeira corrida pela equipe, aos 18 anos.',
  },
  {
    year: '2021',
    frame: 'side',
    align: 'left',
    src: perez2021,
    creditKey: 'perez2021',
    alt: 'Max Verstappen ao lado de Sergio Pérez em Silverstone, 2021',
    title: 'Primeiro título.',
    copy: 'Decide o campeonato contra Lewis Hamilton na última volta do GP de Abu Dhabi.',
  },
  {
    year: '2024',
    frame: 'centre',
    src: grid2024,
    creditKey: 'grid2024',
    alt: 'Max Verstappen no grid do GP da Holanda de 2024',
    title: 'Tetracampeão.',
    copy: 'Depois de 2021, 2022 e 2023, com o recorde de 19 vitórias num só ano, fecha o quarto título consecutivo.',
  },
  {
    year: '2025',
    frame: 'side',
    align: 'right',
    src: rb212025,
    creditKey: 'rb21_2025',
    alt: 'Red Bull RB21 de Max Verstappen no GP do Japão de 2025',
    title: 'Por dois pontos.',
    copy: 'Vence oito corridas, mas perde o título para Lando Norris por 423 a 421 na etapa final.',
  },
  {
    year: '2026',
    frame: 'centre',
    src: rb222026,
    creditKey: 'rb22_2026',
    alt: 'Red Bull RB22 número 3 de Max Verstappen no GP da China de 2026',
    title: 'Número 3, nova era.',
    copy: 'Estreia a parceria Red Bull-Ford com o número 3 e soma seis pódios nas 14 primeiras corridas de 2026.',
  },
]
