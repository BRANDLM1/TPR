type ContentType = {
  title: string;
  content: string;
  media: Media;
};

type Media = {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  poster?: string;
};

export const StoryContent: Record<string, ContentType> = {
  "bison-intro": {
    "title": "Welcome to the Bison Rehoming Story",
    "content": "Join us on a journey through time to understand how we can restore bison populations to their ancestral lands.",
    "media": {
      "type": "image",
      "src": "/pictures/bison-intro.jpg",
      "alt": "Bison herd on plains"
    }
  },
  "bison-h1": {
    "title": "1800s: 60 Million Bison",
    "content": "Before European settlement, an estimated 60 million bison roamed the Great Plains. These massive herds were the backbone of Plains Indian culture and ecology.",
    "media": {
      "type": "image", 
      "src": "/pictures/historical-bison.ppg",
      "alt": "Historical bison herd illustration"
    }
  },
  "bison-h2": {
    "title": "Colonization",
    "content": "Within just 5 years, 99% of bison populations in the US were decimated",
    "media": {
      "type": "image",
      "src": "/pictures/bison-intro.jpg", 
      "alt": "Bison Genocide"
    }
  },
  "bison-h3": {
    "title": "Today: A Different Reality",
    "content": "Today, only about 500,000 bison exist, mostly in private herds and national parks. See how dramatically the landscape has changed.",
    "media": {
      "type": "image",
      "src": "/pictures/bison-intro.jpg", 
      "alt": "Modern bison conservation area"
    }
  },
  "bison-current": {
    "title": "Our Vision: Restoration",
    "content": "The Tipi Raisers is working to establish new grazing areas and rehabilitation sites to expand bison populations sustainably.",
    "media": {
      "type": "video",
      "src": "/media/pictures/bison-intro.jpg",
      "alt": "Traditional and modern Native housing"
    }
  },
  "housing-intro": {
    "title": "Housing on Tribal Lands",
    "content": "Explore our comprehensive approach to addressing housing challenges in Native American communities.",
    "media": {
      "type": "image",
      "src": "/pictures/bison-intro.jpg",
      "alt": "Traditional and modern Native housing"
    }
  }
}
