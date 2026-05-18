const lorem = `Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium,

totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas

sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et

dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea

commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum

fugiat quo voluptas nulla pariatur?"`;

const altLorem = `At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias

excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.

Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possumus,

omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe

eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis

voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat."`;

export const mockReadingBook = {
  id: 'mock-book',
  title: 'Lorem Ispsum Dolor',
  author: 'Lorem Author',
  cover_image_url: 'https://via.placeholder.com/200x300?text=Book+Cover',
  pages: Array.from({ length: 10 }, (_, i) => ({
    chapter: i + 1,
    chapterTitle: 'Lorem Ispsum Dolor',
    left: i % 2 === 0 ? lorem : altLorem,
    right: i % 2 === 0 ? lorem : altLorem,
  })),
};

export const mockAnnotations = [
  { id: 'a1', chapter: 1, title: 'Chapter 1: Lorem Ipsum Dolor Totum' },
  { id: 'a2', chapter: 2, title: 'Chapter 2: Lorem Ipsum Dolor' },
  { id: 'a3', chapter: 3, title: 'Chapter 3: Lorem Ipsum Dolor Totum' },
  { id: 'a4', chapter: 4, title: 'Chapter 4: Lorem Ipsum Dolor' },
  { id: 'a5', chapter: 5, title: 'Chapter 5: Lorem Ipsum Dolor Totum .Lorem Ipsum Dolor' },
  { id: 'a6', chapter: 6, title: 'Chapter 6: Lorem Ipsum Dolor' },
  { id: 'a7', chapter: 7, title: 'Chapter 7: Lorem Ipsum Dolor' },
  { id: 'a8', chapter: 8, title: 'Chapter 8: Lorem Ipsum Dolor Totum Lorem Ipsum Dolor Totum' },
];
