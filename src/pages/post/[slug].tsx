import PrismicDom from 'prismic-dom';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  const wordCount = post.data.content.reduce((sumContent, thisContent) => {
    const headingWords = thisContent.heading.split(/\s/g).length;
    const bodyWords = thisContent.body.reduce((sumBody, thisBody) => {
      const textWords = thisBody.text.split(/\s/g).length;

      return sumBody + textWords;
    }, 0);
    return sumContent + headingWords + bodyWords;
  }, 0);

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }
  return (
    <>
      <Header />
      <main className={styles.post}>
        <img
          className={styles.banner}
          src={post.data.banner.url}
          alt="banner"
        />
        <article className={styles.postContent}>
          <h1>{post.data.title}</h1>
          <div className={styles.info}>
            <div>
              <FiCalendar />
              <span>{post.first_publication_date}</span>
            </div>
            <div>
              <FiUser />
              <span>{post.data.author}</span>
            </div>
            <div>
              <FiClock />
              <span>{Math.ceil(wordCount / 200)} min</span>
            </div>
          </div>
          {post.data.content.map(section => (
            <section key={section.heading} className={styles.section}>
              <h2>{section.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: PrismicDom.RichText.asHtml(section.body),
                }}
              />
            </section>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  const paths = posts.results.map(post => ({ params: { slug: post.uid } }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient({});
  const { slug } = params;
  const response = await prismic.getByUID('posts', slug as string);

  const formattedPost = {
    ...response,
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy',
      {
        locale: ptBR,
      }
    ),
  };

  return {
    props: {
      post: formattedPost,
    },
  };
};
