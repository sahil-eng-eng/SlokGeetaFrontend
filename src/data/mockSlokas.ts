import { Sloka, Book, MeaningNode } from "@/types/sloka";

export const mockBooks: Book[] = [
  { id: "b1", title: "Bhagavad Gita", author: "Vyasa", description: "The essence of Vedic knowledge and one of the most important Upanishads", category: "scripture", slokaCount: 18, visibility: "public", followers: 142 },
  { id: "b2", title: "Yoga Sutras", author: "Patanjali", description: "Foundation of yoga philosophy and practice", category: "philosophy", slokaCount: 12, visibility: "public", followers: 89 },
  { id: "b3", title: "Upanishads", author: "Various Rishis", description: "Philosophical texts forming the theoretical basis for Hinduism", category: "scripture", slokaCount: 24, visibility: "private" },
  { id: "b4", title: "Ramayana", author: "Valmiki", description: "Epic poem narrating the life of Rama", category: "epic", slokaCount: 32, visibility: "public", followers: 204 },
  { id: "b5", title: "Mahabharata", author: "Vyasa", description: "The great epic of ancient India", category: "epic", slokaCount: 45, visibility: "public", followers: 310 },
  { id: "b6", title: "Rigveda", author: "Various Rishis", description: "Collection of Vedic Sanskrit hymns", category: "veda", slokaCount: 28, visibility: "shared" },
  { id: "b7", title: "Arthashastra", author: "Kautilya", description: "Ancient treatise on statecraft and economics", category: "philosophy", slokaCount: 15, visibility: "public", followers: 56 },
  { id: "b8", title: "Dhammapada", author: "Various", description: "Collection of sayings of the Buddha", category: "scripture", slokaCount: 20, visibility: "public", followers: 78 },
  { id: "b9", title: "Vivekachudamani", author: "Shankaracharya", description: "Crest-jewel of discrimination", category: "philosophy", slokaCount: 10, visibility: "private" },
  { id: "b10", title: "Ashtavakra Gita", author: "Ashtavakra", description: "Dialogue on the nature of soul and reality", category: "scripture", slokaCount: 8, visibility: "public", followers: 45 },
  { id: "b11", title: "Brahma Sutras", author: "Badarayana", description: "Aphorisms summarizing Vedantic philosophy", category: "philosophy", slokaCount: 16, visibility: "shared" },
  { id: "b12", title: "Samaveda", author: "Various Rishis", description: "Veda of melodies and chants", category: "veda", slokaCount: 22, visibility: "public", followers: 33 },
];

export const sharedBooks: Book[] = [
  { id: "sb1", title: "Mandukya Upanishad", author: "Gaudapada", description: "Shortest yet most profound of the Upanishads", category: "scripture", slokaCount: 12, visibility: "shared", sharedBy: "Dr. Sharma", sharedAt: "2026-03-10" },
  { id: "sb2", title: "Tattva Bodha", author: "Shankaracharya", description: "Introduction to Vedantic concepts", category: "philosophy", slokaCount: 8, visibility: "shared", sharedBy: "Prof. Gupta", sharedAt: "2026-03-14" },
];

function makeMeaning(overrides: Partial<MeaningNode> & { id: string; text: string; author: string }): MeaningNode {
  return {
    votes: 0,
    createdAt: "2026-01-16",
    status: "approved",
    isOwner: false,
    reactions: [
      { type: "agree", count: 0, reacted: false },
      { type: "insightful", count: 0, reacted: false },
      { type: "disagree", count: 0, reacted: false },
    ],
    versions: [],
    children: [],
    ...overrides,
  };
}

export const mockSlokas: Sloka[] = [
  {
    id: "s1",
    title: "Chapter 2, Verse 47",
    text: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥",
    bookId: "b1",
    order: 1,
    visibility: "public",
    createdAt: "2026-01-15",
    meanings: [
      makeMeaning({
        id: "m1",
        text: "You have the right to perform your prescribed duties, but you are not entitled to the fruits of your actions.",
        author: "Scholar A",
        authorReputation: 92,
        votes: 24,
        isOwner: true,
        status: "approved",
        reactions: [
          { type: "agree", count: 18, reacted: true },
          { type: "insightful", count: 7, reacted: false },
          { type: "disagree", count: 1, reacted: false },
        ],
        versions: [
          { id: "v1", text: "Original text of the meaning", editedAt: "2026-01-16", editedBy: "Scholar A" },
          { id: "v2", text: "You have the right to perform your prescribed duties, but you are not entitled to the fruits of your actions.", editedAt: "2026-01-18", editedBy: "Scholar A" },
        ],
        children: [
          makeMeaning({
            id: "m1-1",
            text: "This teaches detachment from results while maintaining dedication to action.",
            author: "Scholar B",
            authorReputation: 78,
            votes: 18,
            status: "approved",
            reactions: [
              { type: "agree", count: 12, reacted: false },
              { type: "insightful", count: 5, reacted: true },
              { type: "disagree", count: 0, reacted: false },
            ],
            children: [
              makeMeaning({ id: "m1-1-1", text: "Detachment here doesn't mean indifference, but freedom from anxiety about outcomes.", author: "Scholar C", authorReputation: 65, votes: 12, status: "approved" }),
              makeMeaning({ id: "m1-1-2", text: "This is the foundation of Karma Yoga — selfless action.", author: "Scholar A", authorReputation: 92, votes: 15, status: "approved", isOwner: true }),
            ],
          }),
          makeMeaning({
            id: "m1-2",
            text: "The verse establishes the principle of Nishkama Karma — action without desire for reward.",
            author: "Scholar D",
            authorReputation: 45,
            votes: 20,
            status: "pending",
            reactions: [
              { type: "agree", count: 8, reacted: false },
              { type: "insightful", count: 3, reacted: false },
              { type: "disagree", count: 2, reacted: false },
            ],
          }),
        ],
      }),
      makeMeaning({
        id: "m2",
        text: "Focus on the effort, not the outcome. This is the key to inner peace and effective action.",
        author: "Scholar E",
        authorReputation: 55,
        votes: 16,
        status: "approved",
        children: [
          makeMeaning({ id: "m2-1", text: "Modern psychology supports this: process-oriented thinking leads to better performance.", author: "Scholar B", authorReputation: 78, votes: 10, status: "pending" }),
        ],
      }),
    ],
  },
  {
    id: "s2",
    title: "Chapter 2, Verse 14",
    text: "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।\nआगमापायिनोऽनित्यास्तांस्तितिक्षस्व भारत॥",
    bookId: "b1",
    order: 2,
    visibility: "public",
    createdAt: "2026-01-15",
    meanings: [
      makeMeaning({
        id: "m3",
        text: "The contact of senses with their objects gives rise to feelings of cold, heat, pleasure, and pain. They are transient — learn to endure them.",
        author: "Scholar A",
        authorReputation: 92,
        votes: 22,
        isOwner: true,
        status: "approved",
        children: [
          makeMeaning({ id: "m3-1", text: "This verse teaches equanimity in the face of dualities.", author: "Scholar C", authorReputation: 65, votes: 14, status: "approved" }),
        ],
      }),
    ],
  },
  {
    id: "s3",
    title: "Chapter 4, Verse 7",
    text: "यदा यदा हि धर्मस्य ग्लानिर्भवति भारत।\nअभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥",
    bookId: "b1",
    order: 3,
    visibility: "public",
    createdAt: "2026-01-15",
    meanings: [
      makeMeaning({ id: "m4", text: "Whenever there is a decline in righteousness and an increase in unrighteousness, I manifest Myself.", author: "Scholar D", authorReputation: 45, votes: 30, status: "approved", isOwner: true }),
    ],
  },
];
