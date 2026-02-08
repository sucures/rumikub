import React from 'react';
import { Link } from 'react-router-dom';

export default function RoomsPage() {
  const rooms: { id: string; name: string; players: number; maxPlayers: number }[] = [];

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors duration-200 mb-8 py-1 -ml-1 rounded-lg hover:bg-gray-800/50 px-2"
      >
        <span aria-hidden>←</span> Home
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 tracking-tight">
            Game rooms
          </h1>
          <p className="text-sm text-gray-400">
            Create a room or join one with a code.
          </p>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="card p-8 sm:p-10 text-center animate-fade-in-up">
          <div
            className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-700/40 flex items-center justify-center text-3xl text-gray-500 transition-transform duration-300 hover:scale-105"
            aria-hidden
          >
            🎲
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No rooms yet</h2>
          <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-sm mx-auto leading-relaxed">
            Create a room to invite friends, or use the API to create/join a room and open the game link (e.g. /game/:id) to play.
          </p>
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-600 text-white font-medium hover:bg-amber-500 active:scale-[0.98] transition-all duration-200"
          >
            <span aria-hidden>←</span> Back to home
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {rooms.map((room, i) => (
            <li key={room.id} className="animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
              <Link
                to={`/game/${room.id}`}
                className="card card-hover flex items-center justify-between p-4 sm:p-5 block transition-all duration-200"
              >
                <span className="font-medium text-white">{room.name}</span>
                <span className="text-sm text-gray-400 tabular-nums">
                  {room.players}/{room.maxPlayers} players
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
