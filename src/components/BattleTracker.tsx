import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useQuery } from '@tanstack/react-query'

interface BattleStats {
  player_tag: string
  player_name: string
  wins: number
  losses: number
  ties: number
  win_rate: number
  total_crowns: number
  avg_crowns_per_match: number
}

interface Player {
  _id: string
  playerId: string
  playerName: string
  lastUpdated: string
}

export function BattleTracker() {
  const [player1, setPlayer1] = useState('')
  const [player2, setPlayer2] = useState('')
  const [results, setResults] = useState<{
    player1_stats: BattleStats
    player2_stats: BattleStats
    matches: any[]
  } | null>(null)

  // Fetch players list
  const { data: players } = useQuery({
    queryKey: ['players'],
    queryFn: async () => {
      const response = await fetch('http://148.251.121.187:1880/clash/players')
      const data = await response.json()
      return data.data as Player[]
    }
  })

  const handleSearch = async () => {
    try {
      const response = await fetch(`http://148.251.121.187:1880/battles/aggregate`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 222222',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          player1: player1,
          player2: player2,
          type: 'clanMate'
        })
      })
      
      const data = await response.json()
      setResults(data[0])
    } catch (error) {
      console.error('Error fetching battle data:', error)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center space-y-8">
        <img 
          src="https://supercell.com/images/53c91cc7ddf17d5b6fa13cae4762af1b/main_logo_clashroyale.5e3fbb70__1_.webp" 
          alt="Clash Royale Logo" 
          className="w-80 h-auto mb-4 animate-pulse"
        />
        
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Battle Tracker
        </h1>

        <Card className="w-full max-w-4xl p-6 bg-card/50 backdrop-blur-sm">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <label className="text-foreground">Player 1</label>
              <Select value={player1} onValueChange={setPlayer1}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Player 1..." />
                </SelectTrigger>
                <SelectContent>
                  {players?.map((player) => (
                    <SelectItem key={player._id} value={player.playerId}>
                      {player.playerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-foreground">Player 2</label>
              <Select value={player2} onValueChange={setPlayer2}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Player 2..." />
                </SelectTrigger>
                <SelectContent>
                  {players?.map((player) => (
                    <SelectItem key={player._id} value={player.playerId}>
                      {player.playerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="mt-6 w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-4 rounded"
          >
            Search Battles
          </button>

          {results && (
            <div className="mt-8">
              <div className="grid grid-cols-2 gap-8 mb-8">
                <Card className="p-4">
                  <h3 className="text-xl font-bold mb-4">{results.player1_stats.player_name}</h3>
                  <div className="space-y-2">
                    <p>Wins: {results.player1_stats.wins}</p>
                    <p>Losses: {results.player1_stats.losses}</p>
                    <p>Win Rate: {results.player1_stats.win_rate}%</p>
                    <p>Avg Crowns: {results.player1_stats.avg_crowns_per_match}</p>
                  </div>
                </Card>
                <Card className="p-4">
                  <h3 className="text-xl font-bold mb-4">{results.player2_stats.player_name}</h3>
                  <div className="space-y-2">
                    <p>Wins: {results.player2_stats.wins}</p>
                    <p>Losses: {results.player2_stats.losses}</p>
                    <p>Win Rate: {results.player2_stats.win_rate}%</p>
                    <p>Avg Crowns: {results.player2_stats.avg_crowns_per_match}</p>
                  </div>
                </Card>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Game Mode</TableHead>
                    <TableHead>Winner</TableHead>
                    <TableHead>Crowns</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.matches.map((match, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(match.battleTime).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{match.gameMode}</TableCell>
                      <TableCell>
                        {match.player1_result === 'win' 
                          ? results.player1_stats.player_name 
                          : results.player2_stats.player_name}
                      </TableCell>
                      <TableCell>
                        {`${match.team[0].crowns} - ${match.opponent[0].crowns}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}