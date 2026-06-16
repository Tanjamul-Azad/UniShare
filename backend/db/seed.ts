import type { Database } from "better-sqlite3";
import bcrypt from "bcryptjs";

const DEFAULT_PASSWORD = "admin123";

export function seedDatabase(db: Database) {
  const existing = db
    .prepare("SELECT COUNT(*) as count FROM users")
    .get() as { count: number };
  if (existing.count > 0) {
    return;
  }

  const passwordHash = bcrypt.hashSync(DEFAULT_PASSWORD, 10);
  const now = new Date().toISOString();

  const users = [
    {
      id: "u-admin",
      name: "Admin",
      email: "i.m.tanjamul@gmail.com",
      role: "admin",
      verificationStatus: "verified",
      uiuEmail: "ayesha@uiu.edu",
      uiuIdNumber: "UIU-1001",
      joinedDate: "January 2024",
    },
    {
      id: "u-seller",
      name: "Nafis Ahmed",
      email: "nafis@gmail.com",
      role: "user",
      verificationStatus: "verified",
      uiuEmail: "nafis@uiu.edu",
      uiuIdNumber: "UIU-1002",
      joinedDate: "February 2024",
    },
    {
      id: "u-buyer",
      name: "Farhana Chowdhury",
      email: "farhana@gmail.com",
      role: "user",
      verificationStatus: "verified",
      uiuEmail: "farhana@uiu.edu",
      uiuIdNumber: "UIU-1003",
      joinedDate: "March 2024",
    },
    {
      id: "u-unverified",
      name: "Imran Hasan",
      email: "imran@gmail.com",
      role: "user",
      verificationStatus: "unverified",
      uiuEmail: "imran@uiu.edu",
      uiuIdNumber: "UIU-1004",
      joinedDate: "April 2024",
    },
    {
      id: "u-student1",
      name: "Tania Sultana",
      email: "tania@gmail.com",
      role: "user",
      verificationStatus: "verified",
      uiuEmail: "tania@uiu.edu",
      uiuIdNumber: "UIU-1005",
      joinedDate: "May 2024",
    },
    {
      id: "u-student2",
      name: "Rafiul Islam",
      email: "rafiul@gmail.com",
      role: "user",
      verificationStatus: "verified",
      uiuEmail: "rafiul@uiu.edu",
      uiuIdNumber: "UIU-1006",
      joinedDate: "May 2024",
    },
  ];

  const listings = [
    {
      id: "item-101",
      sellerId: "u-seller",
      title: "CSE 221 Algorithms Workbook",
      type: "sell",
      price: 18,
      condition: "Good",
      category: "Textbooks",
      description: "Clean notes, solved problems, and past exam highlights.",
      imageUrl:
        "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "item-102",
      sellerId: "u-seller",
      title: "EEE Lab Toolkit",
      type: "sell",
      price: 32,
      condition: "Like New",
      category: "Lab Gear",
      description: "Multimeter, jumper wires, and quick-reference guide.",
      imageUrl:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "item-103",
      sellerId: "u-student1",
      title: "UIU Calculus Note Pack",
      type: "share",
      price: 0,
      condition: "Good",
      category: "Course Notes",
      description: "Weekly summary sheets and exam prep cards.",
      imageUrl:
        "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "item-104",
      sellerId: "u-student2",
      title: "Project Kit: Arduino Starter",
      type: "barter",
      price: 0,
      condition: "New",
      category: "Project Kits",
      description: "Open to trade for design tools or lab hours.",
      imageUrl:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "item-105",
      sellerId: "u-buyer",
      title: "Linear Algebra Flashcards",
      type: "sell",
      price: 9,
      condition: "Good",
      category: "Course Notes",
      description: "Compact formula deck with solved examples.",
      imageUrl:
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "item-106",
      sellerId: "u-student1",
      title: "Physics Lab Report Template",
      type: "share",
      price: 0,
      condition: "Good",
      category: "Lab Gear",
      description: "Editable doc with rubric tips and formatting.",
      imageUrl:
        "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80",
    },
    {
      id: "item-107",
      sellerId: "u-seller",
      title: "Blue Gel Pen",
      type: "sell",
      price: 5,
      condition: "New",
      category: "Stationery",
      description: "Smooth ink flow, fast-drying, great for notes.",
      imageUrl:
        "https://images.unsplash.com/photo-1485579149621-3123dd979885?auto=format&fit=crop&w=800&q=80",
    },
  ];

  const groups = [
    {
      id: "group-201",
      ownerId: "u-student1",
      service: "Spotify Family Plan",
      type: "share",
      totalPrice: 12.0,
      totalSpots: 6,
      description: "Need 4 more members, payment via bKash.",
      durationMonths: 6,
      icon: "Music",
    },
    {
      id: "group-202",
      ownerId: "u-student2",
      service: "UIU Hostel Sublet",
      type: "sublet",
      totalPrice: 120.0,
      totalSpots: 1,
      description: "Single seat, utilities included.",
      durationMonths: 3,
      icon: "Key",
    },
  ];

  const groupMembers = [
    { id: "gm-1", groupId: "group-201", userId: "u-student1" },
    { id: "gm-2", groupId: "group-201", userId: "u-buyer" },
  ];

  const reviews = [
    {
      id: "review-301",
      reviewerId: "u-buyer",
      sellerId: "u-seller",
      itemId: "item-101",
      rating: 5,
      comment: "Great condition and super helpful notes!",
      createdAt: now,
    },
    {
      id: "review-302",
      reviewerId: "u-student1",
      sellerId: "u-seller",
      itemId: "item-102",
      rating: 4,
      comment: "Everything worked well, quick handoff.",
      createdAt: now,
    },
  ];

  const cartItems = [
    { id: "cart-1", userId: "u-seller", itemId: "item-105" },
    { id: "cart-2", userId: "u-seller", itemId: "item-102" },
  ];

  const orders: any[] = [];

  const orderItems: any[] = [];

  const hoursAgo = (h: number) =>
    new Date(Date.now() - h * 3600 * 1000).toISOString();

  const communityPosts = [
    {
      id: "cp-seed-1",
      authorId: "u-student2",
      content:
        "Need a scientific calculator (FX-991) for my CSE 221 exam starting at 2 PM. Can borrow for just 2 hours 🙏",
      category: "help",
      isUrgent: 1,
      location: "Building B, Room 402",
      createdAt: hoursAgo(1),
    },
    {
      id: "cp-seed-2",
      authorId: "u-student1",
      content:
        "Found a black UIU lanyard with a set of keys near the library entrance. DM to claim!",
      category: "lost_found",
      isUrgent: 0,
      location: "Central Library",
      createdAt: hoursAgo(3),
    },
    {
      id: "cp-seed-3",
      authorId: "u-seller",
      content:
        "Robotics Club meetup this Thursday 4 PM — bring your project ideas and questions. Free pizza 🍕",
      category: "event",
      isUrgent: 0,
      location: "Auditorium",
      createdAt: hoursAgo(6),
    },
    {
      id: "cp-seed-4",
      authorId: "u-buyer",
      content:
        "Forming a study group for Database Systems (CSE 311) before midterms. Comment if you want in!",
      category: "study",
      isUrgent: 0,
      location: null,
      createdAt: hoursAgo(20),
    },
  ];

  const communityComments = [
    {
      id: "cc-seed-1",
      postId: "cp-seed-1",
      authorId: "u-buyer",
      content: "I have one and I'm in Building B right now — coming up to you!",
      createdAt: hoursAgo(0.8),
    },
    {
      id: "cc-seed-2",
      postId: "cp-seed-4",
      authorId: "u-student2",
      content: "Count me in, I really need the practice.",
      createdAt: hoursAgo(18),
    },
  ];

  const communityLikes = [
    { id: "cl-seed-1", postId: "cp-seed-1", userId: "u-buyer" },
    { id: "cl-seed-2", postId: "cp-seed-1", userId: "u-seller" },
    { id: "cl-seed-3", postId: "cp-seed-3", userId: "u-buyer" },
    { id: "cl-seed-4", postId: "cp-seed-3", userId: "u-student2" },
    { id: "cl-seed-5", postId: "cp-seed-4", userId: "u-student2" },
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (
      id, name, email, password_hash, role, avatar, phone, address, bio,
      university, major, graduation_year, uiu_email, uiu_id_number, uiu_id_image,
      verification_status, verification_note, verification_submitted_at,
      verification_reviewed_at, joined_date
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertListing = db.prepare(`
    INSERT INTO marketplace_items (
      id, seller_id, title, type, price, exchange_for, condition, category,
      description, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGroup = db.prepare(`
    INSERT INTO subscription_groups (
      id, owner_id, service, type, total_price, total_spots, description,
      duration_months, icon
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGroupMember = db.prepare(
    "INSERT INTO group_members (id, group_id, user_id) VALUES (?, ?, ?)",
  );

  const insertReview = db.prepare(`
    INSERT INTO reviews (
      id, reviewer_id, seller_id, item_id, rating, comment, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCartItem = db.prepare(`
    INSERT INTO cart_items (id, user_id, item_id)
    VALUES (?, ?, ?)
  `);

  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, buyer_id, total_amount, fee, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (
      id, order_id, item_id, price_at_purchase, status
    ) VALUES (?, ?, ?, ?, ?)
  `);

  const insertCommunityPost = db.prepare(`
    INSERT INTO community_posts (
      id, author_id, content, category, is_urgent, location, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCommunityComment = db.prepare(`
    INSERT INTO community_comments (id, post_id, author_id, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertCommunityLike = db.prepare(
    "INSERT INTO community_likes (id, post_id, user_id) VALUES (?, ?, ?)",
  );

  const seedTx = db.transaction(() => {
    for (const user of users) {
      insertUser.run(
        user.id,
        user.name,
        user.email,
        passwordHash,
        user.role,
        null,
        null,
        null,
        null,
        "United International University",
        "Computer Science",
        "2026",
        user.uiuEmail,
        user.uiuIdNumber,
        null,
        user.verificationStatus,
        null,
        user.verificationStatus === "verified" ? now : null,
        user.verificationStatus === "verified" ? now : null,
        user.joinedDate,
      );
    }

    for (const listing of listings) {
      insertListing.run(
        listing.id,
        listing.sellerId,
        listing.title,
        listing.type,
        listing.price,
        null,
        listing.condition,
        listing.category,
        listing.description,
        listing.imageUrl,
      );
    }

    for (const group of groups) {
      insertGroup.run(
        group.id,
        group.ownerId,
        group.service,
        group.type,
        group.totalPrice,
        group.totalSpots,
        group.description,
        group.durationMonths,
        group.icon,
      );
    }

    for (const member of groupMembers) {
      insertGroupMember.run(member.id, member.groupId, member.userId);
    }

    for (const review of reviews) {
      insertReview.run(
        review.id,
        review.reviewerId,
        review.sellerId,
        review.itemId,
        review.rating,
        review.comment,
        review.createdAt,
      );
    }

    for (const item of cartItems) {
      insertCartItem.run(item.id, item.userId, item.itemId);
    }

    for (const order of orders) {
      insertOrder.run(
        order.id,
        order.buyerId,
        order.totalAmount,
        order.fee,
        order.status,
        order.createdAt,
      );
    }

    for (const item of orderItems) {
      insertOrderItem.run(
        item.id,
        item.orderId,
        item.itemId,
        item.priceAtPurchase,
        item.status,
      );
    }

    for (const post of communityPosts) {
      insertCommunityPost.run(
        post.id,
        post.authorId,
        post.content,
        post.category,
        post.isUrgent,
        post.location,
        post.createdAt,
      );
    }

    for (const comment of communityComments) {
      insertCommunityComment.run(
        comment.id,
        comment.postId,
        comment.authorId,
        comment.content,
        comment.createdAt,
      );
    }

    for (const like of communityLikes) {
      insertCommunityLike.run(like.id, like.postId, like.userId);
    }
  });

  seedTx();

  console.log("[db] Seeded demo data for users, listings, groups, and reviews.");
}
