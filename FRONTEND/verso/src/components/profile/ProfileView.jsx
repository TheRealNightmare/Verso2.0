import { useMemo, useState } from 'react';
import { Heart, BookOpen } from 'lucide-react';
import ProfileHeader from './ProfileHeader';
import ProfileStats from './ProfileStats';
import ProfileTabs from './ProfileTabs';
import BookCoverCard from './BookCoverCard';
import Spinner from '../ui/Spinner';

const BookGrid = ({ books }) => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
    {books.map((b) => (
      <BookCoverCard key={b.id} book={b} />
    ))}
  </div>
);

const EmptyState = ({ icon: Icon, message }) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-12 text-slate-400">
    <Icon size={28} />
    <p className="mt-2 text-sm">{message}</p>
  </div>
);

const SectionPreview = ({ title, books, onSeeAll }) => (
  <div>
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
      {books.length > 4 && (
        <button
          type="button"
          onClick={onSeeAll}
          className="text-xs font-medium text-[#5b7c99] hover:underline"
        >
          See all
        </button>
      )}
    </div>
    {books.length === 0 ? (
      <p className="text-sm text-slate-400">Nothing here yet.</p>
    ) : (
      <BookGrid books={books.slice(0, 4)} />
    )}
  </div>
);

/**
 * Shared read-only profile layout: header (with an injected `actions` slot),
 * stat cards, and tabbed Overview / Favorites / Published Books sections.
 */
const ProfileView = ({ profile, favorites = [], authorBooks = [], actions, loadingExtras = false }) => {
  const isAuthor = profile.role === 'author';
  const [active, setActive] = useState('overview');

  const tabs = useMemo(() => {
    const list = [
      { key: 'overview', label: 'Overview' },
      { key: 'favorites', label: 'Favorites', count: favorites.length },
    ];
    if (isAuthor) {
      list.push({
        key: 'books',
        label: 'Published Books',
        count: profile.publishedBooksCount ?? authorBooks.length,
      });
    }
    return list;
  }, [isAuthor, favorites.length, authorBooks.length, profile.publishedBooksCount]);

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <ProfileHeader profile={profile} actions={actions} />

      <ProfileStats stats={profile.stats} />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <ProfileTabs tabs={tabs} active={active} onChange={setActive} />

        <div className="pt-5">
          {loadingExtras ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <>
              {active === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="mb-1.5 text-sm font-semibold text-slate-700">About</h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {profile.bio || 'This user hasn’t written a bio yet.'}
                    </p>
                  </div>

                  <SectionPreview
                    title="Favorite books"
                    books={favorites}
                    onSeeAll={() => setActive('favorites')}
                  />

                  {isAuthor && (
                    <SectionPreview
                      title="Published books"
                      books={authorBooks}
                      onSeeAll={() => setActive('books')}
                    />
                  )}
                </div>
              )}

              {active === 'favorites' &&
                (favorites.length === 0 ? (
                  <EmptyState icon={Heart} message="No favorite books yet." />
                ) : (
                  <BookGrid books={favorites} />
                ))}

              {active === 'books' &&
                (authorBooks.length === 0 ? (
                  <EmptyState icon={BookOpen} message="No books published yet." />
                ) : (
                  <BookGrid books={authorBooks} />
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
