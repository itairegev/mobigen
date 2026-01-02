import { NewsArticle } from '@/types';

const now = new Date();

export const MOCK_NEWS: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Thunder FC Secures Dominant 3-1 Victory Over Dynamo United',
    summary: 'Marcus Rodriguez scores twice as Thunder FC continues their winning streak at home.',
    content: `Thunder FC put on an impressive display at Thunder Stadium last night, defeating Dynamo United 3-1 in front of a sold-out crowd. Team captain Marcus Rodriguez was the star of the show, scoring two brilliant goals in the first half.\n\nThe home side dominated from the opening whistle, with Rodriguez opening the scoring in the 15th minute with a stunning strike from outside the box. He doubled the lead just before halftime with a clinical finish after a brilliant through ball from James Wilson.\n\nDynamo pulled one back early in the second half, but any hopes of a comeback were quickly extinguished when Diego Martinez sealed the victory with a header in the 75th minute.\n\nManager praised the team's performance: "The boys were excellent today. We controlled the game from start to finish and deserved the three points."`,
    author: 'Sarah Johnson',
    publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800',
    category: 'match-report',
    tags: ['match-report', 'victory', 'home-game'],
  },
  {
    id: 'news-2',
    title: 'Carlos Santos Signs Contract Extension Until 2027',
    summary: 'Young Brazilian forward commits his future to the club with a new four-year deal.',
    content: `Thunder FC is delighted to announce that Carlos Santos has signed a new contract extension, keeping him at the club until 2027.\n\nThe 22-year-old Brazilian has been in impressive form this season, scoring 9 goals and providing 6 assists in 25 appearances. His performances have attracted interest from several top clubs, but Santos has chosen to continue his development with Thunder FC.\n\n"I'm very happy to extend my contract," said Santos. "This club has given me the opportunity to play at the highest level, and I want to repay that faith by helping us achieve success on the pitch."\n\nClub President added: "Carlos is a special talent with a bright future. We're thrilled that he sees his long-term future here with us."`,
    author: 'Michael Chen',
    publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
    category: 'announcement',
    tags: ['transfer', 'contract', 'carlos-santos'],
  },
  {
    id: 'news-3',
    title: 'James Wilson Ruled Out for Three Weeks with Hamstring Injury',
    summary: 'Midfielder suffered injury in training and will miss upcoming fixtures.',
    content: `Thunder FC confirms that midfielder James Wilson will be sidelined for approximately three weeks due to a hamstring injury sustained during training.\n\nThe 24-year-old playmaker underwent a scan which revealed a grade 1 hamstring strain. The medical team is confident he will make a full recovery and return to action next month.\n\nManager said: "It's disappointing to lose James for a few weeks, but we have depth in the squad. Tyler Park and Hiroshi Tanaka are ready to step up and fill the void."\n\nWilson has been in excellent form this season, contributing 8 goals and 12 assists in 27 appearances.`,
    author: 'Emma Davis',
    publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=800',
    category: 'injury',
    tags: ['injury', 'james-wilson', 'team-news'],
  },
  {
    id: 'news-4',
    title: 'INTERVIEW: Marcus Rodriguez on Captaincy and Season Goals',
    summary: 'Exclusive interview with our captain about leadership and ambitions.',
    content: `In an exclusive interview, Thunder FC captain Marcus Rodriguez opens up about the responsibility of captaincy and his goals for the remainder of the season.\n\nQ: How does it feel to lead this team?\nA: "It's an incredible honor. This club means everything to me, and to be chosen to lead these amazing players is something I don't take lightly. I try to lead by example, both on and off the pitch."\n\nQ: What are your ambitions for this season?\nA: "We want to finish in the top three and secure playoff qualification. We have the quality in our squad to achieve that. Every game is important now."\n\nQ: You're currently the top scorer. Is the golden boot on your mind?\nA: "Individual awards are nice, but team success comes first. If my goals help us win games and reach our objectives, that's what matters most."`,
    author: 'David Thompson',
    publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800',
    category: 'interview',
    tags: ['interview', 'marcus-rodriguez', 'captain'],
  },
  {
    id: 'news-5',
    title: 'Tickets on Sale Now for Bay City Stars Showdown',
    summary: 'Secure your seats for the crucial away fixture next month.',
    content: `Tickets are now available for Thunder FC's away match against Bay City Stars on [date].\n\nThis fixture is expected to be one of the highlights of the season, with both teams vying for playoff positions. The match will kick off at 5:00 PM at Bay Stadium.\n\nTicket prices:\n- General Admission: $45\n- Premium Seats: $85\n- VIP Package: $150 (includes pre-match hospitality)\n\nFans are encouraged to book early as this fixture is expected to sell out quickly. Visit our ticketing portal or call the box office for more information.`,
    author: 'Lisa Martinez',
    publishedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800',
    category: 'announcement',
    tags: ['tickets', 'away-game', 'bay-city-stars'],
  },
  {
    id: 'news-6',
    title: 'Academy Graduate Tyler Park Making His Mark in First Team',
    summary: 'Homegrown talent discusses his journey from academy to professional.',
    content: `Tyler Park's rise through the Thunder FC academy to the first team is a testament to the club's commitment to developing young talent.\n\nThe 23-year-old defensive midfielder has become an integral part of the squad this season, making 27 appearances and showcasing maturity beyond his years.\n\n"I've been with this club since I was 12 years old," Park explains. "To now be playing alongside players I used to watch from the stands is surreal. But I've worked hard to get here, and I want to keep improving."\n\nAcademy Director praised Park's development: "Tyler is exactly what we want from our academy - a dedicated, talented player who understands what it means to represent this club."`,
    author: 'Robert Kim',
    publishedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800',
    category: 'interview',
    tags: ['academy', 'tyler-park', 'youth-development'],
  },
  {
    id: 'news-7',
    title: 'New Thunder FC Home Kit Unveiled for Next Season',
    summary: 'Bold new design honors club traditions while embracing modern style.',
    content: `Thunder FC has revealed its striking new home kit for the upcoming season, featuring a bold interpretation of the club's traditional colors.\n\nThe new design maintains the iconic blue base while incorporating subtle red accents and a modern collar design. The kit also features improved moisture-wicking technology for enhanced player performance.\n\n"We wanted to create something that honors our history while looking forward to the future," said the club's commercial director.\n\nThe new kit is now available for pre-order in the official club shop and online store, with delivery expected before the start of next season. Fans who pre-order will receive a 15% discount.`,
    author: 'Jennifer Lopez',
    publishedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=800',
    category: 'announcement',
    tags: ['merchandise', 'kit-launch', 'next-season'],
  },
  {
    id: 'news-8',
    title: 'Thunder FC Foundation Launches Community Youth Program',
    summary: 'New initiative aims to provide free coaching to 500 local children.',
    content: `The Thunder FC Foundation has announced the launch of a major new community program that will provide free football coaching to 500 children from underserved communities.\n\nThe program will run throughout the year, offering weekly coaching sessions led by qualified coaches and guest appearances from first-team players.\n\n"Football has the power to change lives," said Foundation Director. "This program will give children the opportunity to develop not just football skills, but also important life skills like teamwork, discipline, and confidence."\n\nApplications for the program are now open. Priority will be given to children from low-income families. First-team players Marcus Rodriguez and David Chen attended the launch event and expressed their support for the initiative.`,
    author: 'Chris Anderson',
    publishedAt: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
    image: 'https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?w=800',
    category: 'announcement',
    tags: ['community', 'foundation', 'youth-program'],
  },
];

export async function getNews(): Promise<NewsArticle[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_NEWS.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

export async function getNewsArticle(id: string): Promise<NewsArticle | undefined> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return MOCK_NEWS.find((article) => article.id === id);
}

export async function getNewsByCategory(category: NewsArticle['category']): Promise<NewsArticle[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_NEWS.filter((article) => article.category === category).sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  );
}

export async function getLatestNews(limit = 3): Promise<NewsArticle[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_NEWS.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()).slice(0, limit);
}
