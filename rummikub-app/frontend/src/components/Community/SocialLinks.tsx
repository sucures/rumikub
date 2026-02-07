import React, { useEffect, useState } from 'react';
import { Youtube, MessageCircle, Twitter, Instagram, Users, TrendingUp } from 'lucide-react';
import { youtubeService } from '../../../api/socialMedia';

interface SocialLinksProps {
  className?: string;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
  publishedAt: string;
}

export default function SocialLinks({ className = '' }: SocialLinksProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    youtube: 0,
    telegram: 0,
    twitter: 0,
    instagram: 0,
  });

  useEffect(() => {
    loadSocialData();
  }, []);

  const loadSocialData = async () => {
    try {
      // Cargar videos de YouTube
      const videosRes = await fetch('/api/social/youtube/videos');
      const videosData = await videosRes.json();
      if (videosData.success) {
        setVideos(videosData.videos.slice(0, 3));
      }

      // Cargar estadísticas de Telegram
      const telegramRes = await fetch('/api/social/telegram/members');
      const telegramData = await telegramRes.json();
      if (telegramData.success) {
        setStats(prev => ({ ...prev, telegram: telegramData.members }));
      }
    } catch (error) {
      console.error('Error loading social data:', error);
    } finally {
      setLoading(false);
    }
  };

  const socialLinks = [
    {
      name: 'YouTube',
      icon: Youtube,
      url: process.env.VITE_YOUTUBE_URL || 'https://youtube.com/@rummikub',
      color: 'text-red-600 hover:text-red-700',
      bgColor: 'bg-red-50 hover:bg-red-100',
      count: stats.youtube,
      label: 'Suscriptores',
    },
    {
      name: 'Telegram',
      icon: MessageCircle,
      url: process.env.VITE_TELEGRAM_URL || 'https://t.me/rummikub',
      color: 'text-blue-500 hover:text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      count: stats.telegram,
      label: 'Miembros',
    },
    {
      name: 'Twitter/X',
      icon: Twitter,
      url: process.env.VITE_TWITTER_URL || 'https://twitter.com/rummikub',
      color: 'text-slate-800 hover:text-slate-900',
      bgColor: 'bg-slate-50 hover:bg-slate-100',
      count: stats.twitter,
      label: 'Seguidores',
    },
    {
      name: 'Instagram',
      icon: Instagram,
      url: process.env.VITE_INSTAGRAM_URL || 'https://instagram.com/rummikub',
      color: 'text-pink-600 hover:text-pink-700',
      bgColor: 'bg-pink-50 hover:bg-pink-100',
      count: stats.instagram,
      label: 'Seguidores',
    },
  ];

  return (
    <div className={`${className}`}>
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Únete a nuestra Comunidad
          </h2>
          <p className="text-gray-600">
            Síguenos en redes sociales y mantente al día con novedades, torneos y premios
          </p>
        </div>

        {/* Redes Sociales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {socialLinks.map((social) => {
            const Icon = social.icon;
            return (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${social.bgColor} ${social.color} rounded-xl p-6 text-center transition transform hover:scale-105 shadow-md`}
              >
                <Icon size={32} className="mx-auto mb-3" />
                <h3 className="font-bold text-lg mb-1">{social.name}</h3>
                {social.count > 0 && (
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <TrendingUp size={14} />
                    <span>{social.count.toLocaleString()}</span>
                    <span className="text-xs opacity-75">{social.label}</span>
                  </div>
                )}
              </a>
            );
          })}
        </div>

        {/* Videos de YouTube */}
        {videos.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Youtube size={24} className="text-red-600" />
              Últimos Videos
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {videos.map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition transform hover:scale-105"
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-800 line-clamp-2">
                      {video.title}
                    </h4>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Código de Partner */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-2">
            ¿Eres Partner o Influencer?
          </h3>
          <p className="text-gray-600 mb-4">
            Únete a nuestro programa de afiliados y gana comisiones por cada referido
          </p>
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition">
            Convertirse en Partner
          </button>
        </div>
      </div>
    </div>
  );
}
