import AIChat from '../components/AIChat.jsx'

export default function AIAssistant({ activeTicker, predictionData }) {
  return (
    <div className="h-full w-full flex flex-col overflow-hidden bg-white dark:bg-slate-950">
      <AIChat activeTicker={activeTicker} initialPrediction={predictionData} />
    </div>
  )
}
