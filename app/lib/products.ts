export interface Product {
  id: string;
  name: string;
  category: "Woody" | "Floral" | "Citrus" | "Amber" | "Fresh" | "Gourmand";
  tag?: string;
  concentration: string;
  price: number;
  notes: string[];
  description: string;
  image: string;
}

const IMG = "https://iili.io/nwi8eig.png";

export const PRODUCTS: Product[] = [
  { id: "santal-minuit", name: "Santal Minuit", category: "Woody", tag: "Bestseller", concentration: "Eau de parfum · 50 ml", price: 165, notes: ["Sandalwood", "Iris", "Soft musk"], description: "The quiet allure of after dark.", image: "https://images.unsplash.com/photo-1610461888750-10bfc601b874?q=80&w=699&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" },
  { id: "rose-obscure", name: "Rose Obscure", category: "Floral", concentration: "Eau de parfum · 50 ml", price: 155, notes: ["Damask rose", "Pink pepper", "Patchouli"], description: "A rose with a little mystery.", image: "https://images.unsplash.com/photo-1608528577891-eb055944f2e7?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" },
  { id: "soleil-vert", name: "Soleil Vert", category: "Citrus", tag: "New composition", concentration: "Eau de parfum · 50 ml", price: 145, notes: ["Bergamot", "Neroli", "Vetiver"], description: "Golden light. A greener kind of citrus.", image:"https://images.unsplash.com/photo-1611242956059-53e4c29e6b22?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" },
  { id: "ambre-velours", name: "Ambre Velours", category: "Amber", concentration: "Eau de parfum · 50 ml", price: 175, notes: ["Labdanum", "Benzoin", "Vanilla"], description: "Warmth that lingers like an embrace.", image: "https://images.unsplash.com/photo-1519669011783-4eaa95fa1b7d?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" },
  { id: "brume-marine", name: "Brume Marine", category: "Fresh", concentration: "Eau de parfum · 50 ml", price: 145, notes: ["Sea salt", "Sage", "White musk"], description: "A breath of air, close to the skin.", image: "https://images.unsplash.com/photo-1732828912683-57104a2d1b4b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" },
  { id: "tonka-eclipse", name: "Tonka Éclipse", category: "Gourmand", tag: "Cult favourite", concentration: "Eau de parfum · 50 ml", price: 160, notes: ["Tonka bean", "Cacao", "Bourbon vanilla"], description: "Deliciously dark. Never too sweet.", image: "https://images.unsplash.com/photo-1698867928110-2408e8e2f44a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" },
];

export const MOOD_FAMILIES = [
  { name: "Floral", sub: "Soft & luminous", icon: "" },
  { name: "Woody", sub: "Deep & grounding", icon: "" },
  { name: "Citrus", sub: "Bright & spirited", icon: "" },
  { name: "Amber", sub: "Warm & enveloping", icon: "" },
  { name: "Fresh", sub: "Clean & effortless", icon: "" },
  { name: "Gourmand", sub: "Rich & indulgent", icon: "" },
];