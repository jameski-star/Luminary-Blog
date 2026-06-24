# Chapter 4 — TypeScript Without Fear

TypeScript is JavaScript with **types** — annotations that tell your editor and compiler what kind of data each variable holds.

## Why TypeScript exists

```javascript
// JavaScript — bug waits at runtime
function getLength(x) {
  return x.length;
}
getLength('hello');     // 5  (fine)
getLength([1, 2, 3]);   // 3  (fine)
getLength(42);          // undefined  (oops — numbers don't have .length)
```

```typescript
// TypeScript — bug caught as you type
function getLength(x: string | any[]): number {
  return x.length;
}
getLength(42);  // ❌ Red squiggly: Argument of type 'number' not assignable
```

**TypeScript runs at build time only. It compiles to plain JavaScript.** No performance cost.

## The basics

```typescript
// Annotate variables
let name: string = 'Alice';
let age: number = 30;
let isAdmin: boolean = false;
let tags: string[] = ['tech', 'ai'];     // array of strings
let data: any = 'anything';              // any = no type checking (avoid)
```

### Interfaces — shape definitions

```typescript
// Describe the shape of an object
interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';      // union type — must be one of these
  joinedAt: string;
}

// Use it
const user: User = {
  id: 'u_123',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'admin',
  joinedAt: new Date().toISOString(),
};
```

This is exactly how `src/types/index.ts` defines the project's types:

```typescript
// src/types/index.ts (simplified)
export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  joinedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  status: 'draft' | 'published' | 'review' | 'quarantined';
  authorId: string;
  authorName: string;
  publishedAt: string;
  readTime: number;
  views: number;
  likes: number;
  tags: string[];
  auditScore?: number;        // ? means optional
  coverImage?: string;
}
```

### Function types

```typescript
// Parameter types + return type
function add(a: number, b: number): number {
  return a + b;
}

// Arrow function with types
const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString();
};
```

### Type inference

TypeScript figures out most types automatically:

```typescript
let count = 0;     // TypeScript knows it's a number
count = 'hello';   // ❌ Error — can't assign string to number

const result = add(1, 2);  // TypeScript knows result is a number
```

### Optional & union types

```typescript
interface Post {
  title: string;
  excerpt?: string;           // optional — can be string or undefined
  status: 'draft' | 'published' | 'review';  // union
  score: number | null;       // union with null
}

// TypeScript forces you to handle the undefined case
function getExcerpt(post: Post): string {
  return post.excerpt ?? '';  // if undefined, use ''
  //      ^^ nullish coalescing — default if null/undefined
}
```

## Generics — types that take parameters

```typescript
// A function that works with any type
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

const num = firstElement([1, 2, 3]);      // type: number | undefined
const str = firstElement(['a', 'b']);     // type: string | undefined
```

Seen in `src/store/appStore.ts` — `getStoredUsers()` returns `User[]`.

## The `as` keyword (type assertion)

When you know more than TypeScript:

```typescript
const raw = localStorage.getItem('users');
const users = JSON.parse(raw || '[]') as User[];
//                         TypeScript now knows it's User[]
```

**Use `as` sparingly** — it bypasses safety. Prefer proper types.

## Strict mode

This project has `strict: true` in `tsconfig.json`. This means:
- `null` and `undefined` are not assignable to regular types
- Functions must handle every case
- No implicit `any` (you must type everything)

This catches the most bugs. Embrace the red squiggles.

## Your practice

Open `src/types/index.ts`. Read every interface.

Then write a function:

```typescript
interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

function getHighPriorityTasks(tasks: Task[]): Task[] {
  return tasks.filter(t => t.priority === 'high' && !t.completed);
}
```

In [Chapter 5](05-react.md), you'll combine JSX + TypeScript to build components.
