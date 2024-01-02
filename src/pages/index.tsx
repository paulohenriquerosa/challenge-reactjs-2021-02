import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticProps } from 'next';
import { useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [homeData, setHomeData] = useState(postsPagination);

  function handleFetchMorePosts(): void {
    fetch(homeData.next_page).then(response =>
      response.json().then(data => {
        const { next_page, results } = data;

        const formattedResults = results.map(post => {
          return {
            ...post,
            first_publication_date: format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              {
                locale: ptBR,
              }
            ),
          };
        });

        setHomeData({
          next_page,
          results: [...homeData.results, ...formattedResults],
        });
      })
    );
  }

  return (
    <>
      <Header />
      <main className={styles.container}>
        <div className={styles.posts}>
          {homeData.results.map(post => (
            <Link href={`/post/${post.uid}`} key={post.uid}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.info}>
                  <div>
                    <FiCalendar />
                    <span>{post.first_publication_date}</span>
                  </div>
                  <div>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>
        {homeData.next_page && (
          <button type="button" onClick={handleFetchMorePosts}>
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 20,
  });

  const { next_page, results } = postsResponse;

  const formattedResults = results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });

  return {
    props: {
      postsPagination: {
        next_page,
        results: formattedResults,
      },
    },
  };
};
