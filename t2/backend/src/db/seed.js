// seed gerado com gemini
const projetos = [
    {
        id: 'project1',
        title: 'Vulcão em Miniatura: Reação Ácido-Base',
        description: 'Demonstração de uma erupção vulcânica usando bicarbonato de sódio e vinagre, explorando a química da reação ácido-base e a formação de gases. O projeto visa ilustrar princípios geológicos e químicos de forma visual e interativa.',
        participants: ['Sofia Rocha', 'Tiago Alves'],
        category: 'Química/Geografia',
        materials: ['Bicarbonato de Sódio', 'Vinagre', 'Detergente', 'Corante Alimentício', 'Modelo de Vulcão'],
        image: '../public/images/project1.jpg',
        avaliacao: null
    },
    {
        id: 'project2',
        title: 'Sistema Solar Interativo: Proporções e Movimentos',
        description: 'Construção de um modelo em escala do sistema solar que demonstra as proporções dos planetas e suas órbitas. Inclui um mecanismo motorizado para simular o movimento de translação da Terra e da Lua.',
        participants: ['Lucas Gabriel', 'Mariana Santos'],
        category: 'Física/Astronomia',
        materials: ['Bolas de Isopor (vários tamanhos)', 'Arame', 'Motor Elétrico', 'Pintura Acrílica', 'Base de Madeira'],
        image: '/images/project2.jpeg',
        avaliacao: null
    },
    {
        id: 'project3',
        title: 'Fluidos Não Newtonianos: Oobleck e suas Propriedades',
        description: 'Experimentação e análise de fluidos não newtonianos, como o Oobleck (mistura de amido de milho e água), que se comportam como líquido e sólido dependendo da força aplicada. O objetivo é explorar as propriedades reológicas de substâncias não convencionais.',
        participants: ['Beatriz Lima', 'Rafael Cardoso'],
        category: 'Física/Química',
        materials: ['Amido de Milho', 'Água', 'Bacia', 'Corante Alimentício (opcional)'],
        image: '/images/project3.jpg',
        avaliacao: null
    },
    {
        id: 'project4',
        title: 'Circuito Elétrico Básico: Lâmpada de Batata',
        description: 'Construção de um circuito elétrico simples usando batatas, fios de cobre e zinco para acender uma pequena lâmpada LED. O projeto demonstra os princípios da geração de energia eletroquímica.',
        participants: ['Clara Mendes', 'João Victor Farias'],
        category: 'Física/Química',
        materials: ['Batatas', 'Fios de Cobre', 'Parafusos de Zinco', 'Lâmpada LED', 'Fios Condutores'],
        image: '/images/project4.jpeg',
        avaliacao: null
    },
    {
        id: 'project5',
        title: 'Filtro de Água Caseiro: Purificação Sustentável',
        description: 'Criação de um sistema de filtragem de água utilizando materiais acessíveis como areia, cascalho e carvão. O projeto explora os métodos de purificação da água e a importância da sustentabilidade hídrica.',
        participants: ['Helena Costa', 'Felipe Nunes'],
        category: 'Meio Ambiente/Engenharia',
        materials: ['Garrafa PET (cortada)', 'Algodão', 'Carvão Ativado', 'Areia Fina', 'Areia Grossa', 'Cascalho', 'Água Suja'],
        image: '/images/project5.jpeg',
        avaliacao: null
    },
    {
        id: 'project6',
        title: 'Geração de Energia Magnética: Motor Simples',
        description: 'Construção de um motor elétrico rudimentar usando um imã, fio de cobre e uma bateria. O projeto demonstra como a interação entre campos magnéticos e correntes elétricas pode gerar movimento, ilustrando o princípio do eletromagnetismo.',
        participants: ['Isabela Xavier', 'Daniel Pereira'],
        category: 'Física/Tecnologia',
        materials: ['Fio de Cobre Esmaltado', 'Bateria AA', 'Imã de Neodímio', 'Clipes de Papel', 'Base de Madeira'],
        image: '/images/project5.jpeg',
        avaliacao: null
    }
]

module.exports = projetos;