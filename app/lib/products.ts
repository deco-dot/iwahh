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
  // concentration: "Eau de parfum · 50 ml", price: 160, notes: ["Tonka bean", "Cacao", "Bourbon vanilla"], description: "Deliciously dark. Never too sweet.", image: "https://images.unsplash.com/photo-1698867928110-2408e8e2f44a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D" },
];

export const MOOD_FAMILIES = [
  { name: "Floral", sub: "Soft & luminous", icon: "" },
  { name: "Woody", sub: "Deep & grounding", icon: "" },
  { name: "Citrus", sub: "Bright & spirited", icon: "" },
  { name: "Amber", sub: "Warm & enveloping", icon: "" },
  { name: "Fresh", sub: "Clean & effortless", icon: "" },
  { name: "Gourmand", sub: "Rich & indulgent", icon: "" },
];