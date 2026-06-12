import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, AlertTriangle, ChevronDown, Settings, RefreshCw } from 'lucide-react'
import api from '../api'
import DealModal from '../components/DealModal'

function fmt(v) {
  if (!v && v !== 0) return '—'
  if (v >= 1000000) return `$${(v/1000000).toFixed(1)}M`
  if (v >= 1000) return `$${(v/1000).toFixed(0)}K`
  return `$${v.toLocaleString()}`
}

function DealCard({ deal, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 }

  const rottingClass = deal.is_rotting ? 'rotting' : deal.days_since_activity > (deal.rotting_days * 0.7) ? 'rotting-warning' : ''

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`deal-card ${rottingClass}`} onClick={() => onClick(deal)}>
      {deal.label && (
        <span className="deal-label" style={{background:'#ede9fe',color:'#6d28d9'}}>{deal.label}</span>
      )}
      <div className="deal-card-title">{deal.title}</div>
      {deal.organization_name && <div className="deal-card-org">{deal.organization_name}</div>}
      <div className="deal-card-footer">
        <span className="deal-card-value">{fmt(deal.value)}</span>
        <div className="deal-card-owner" title={deal.owner_name}>{deal.owner_name?.[0]?.toUpperCase()}</div>
      </div>
      {deal.is_rotting && (
        <div className="rotting-icon"><AlertTriangle size={11}/>{deal.days_since_activity}d no activity</div>
      )}
    </div>
  )
}

function StageColumn({ stage, deals, onDealClick, onAddDeal }) {
  const total = deals.reduce((s,d) => s + (d.value||0), 0)
  return (
    <div className="pipeline-column">
      <div className="pipeline-col-header">
        <div>
          <div className="pipeline-col-name">{stage.name}</div>
          <div className="pipeline-col-stats">{fmt(total)}</div>
        </div>
        <span className="pipeline-col-count">{deals.length}</span>
      </div>
      <SortableContext items={deals.map(d=>d.id)} strategy={verticalListSortingStrategy}>
        <div className="pipeline-col-body" id={`stage-${stage.id}`}>
          {deals.map(d => <DealCard key={d.id} deal={d} onClick={onDealClick}/>)}
        </div>
      </SortableContext>
      <div style={{padding:'8px'}}>
        <button className="btn btn-ghost btn-sm w-full" style={{justifyContent:'center',color:'#6b7280'}}
          onClick={() => onAddDeal(stage)}>
          <Plus size={14}/> Add deal
        </button>
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const navigate = useNavigate()
  const [pipelines, setPipelines] = useState([])
  const [selectedPipeline, setSelectedPipeline] = useState(null)
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDealModal, setShowDealModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState(null)
  const [defaultStage, setDefaultStage] = useState(null)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  useEffect(() => {
    api.get('/pipelines').then(r => {
      setPipelines(r.data)
      if (r.data.length) setSelectedPipeline(r.data[0])
    })
  }, [])

  useEffect(() => {
    if (!selectedPipeline) return
    setLoading(true)
    api.get(`/deals?pipeline_id=${selectedPipeline.id}&status=open`).then(r => {
      setDeals(r.data)
      setLoading(false)
    })
  }, [selectedPipeline])

  const reload = () => {
    if (!selectedPipeline) return
    api.get(`/deals?pipeline_id=${selectedPipeline.id}&status=open`).then(r => setDeals(r.data))
  }

  const stagesForPipeline = selectedPipeline?.stages || []

  const getDealsForStage = stageId => deals.filter(d => d.stage_id === stageId)

  const handleDragStart = ({ active }) => setActiveId(active.id)

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over) return
    const deal = deals.find(d => d.id === active.id)
    if (!deal) return

    // Find target stage
    let targetStageId = null
    for (const stage of stagesForPipeline) {
      const stageDeals = getDealsForStage(stage.id)
      if (stageDeals.find(d => d.id === over.id) || over.id === `stage-${stage.id}`) {
        targetStageId = stage.id
        break
      }
    }
    if (!targetStageId) return
    if (deal.stage_id === targetStageId) return

    const stageDeals = getDealsForStage(targetStageId)
    const newOrder = stageDeals.length

    setDeals(prev => prev.map(d => d.id === deal.id ? { ...d, stage_id: targetStageId, order_num: newOrder } : d))
    api.put(`/deals/${deal.id}/move`, { stage_id: targetStageId, order_num: newOrder, pipeline_id: selectedPipeline.id })
  }

  const handleDealClick = deal => navigate(`/deals/${deal.id}`)

  const handleAddDeal = stage => { setDefaultStage(stage); setEditingDeal(null); setShowDealModal(true) }

  const handleDealSaved = () => { setShowDealModal(false); reload() }

  const activeDeal = deals.find(d => d.id === activeId)

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',overflow:'hidden'}}>
      {/* Topbar */}
      <div className="topbar">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <select className="form-control" style={{width:'auto',padding:'5px 30px 5px 10px',fontSize:14,fontWeight:600}}
            value={selectedPipeline?.id||''} onChange={e => setSelectedPipeline(pipelines.find(p=>p.id===e.target.value))}>
            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <span style={{fontSize:13,color:'#6b7280'}}>
            {deals.length} deals · {fmt(deals.reduce((s,d)=>s+(d.value||0),0))}
          </span>
        </div>
        <div style={{flex:1}}/>
        <div className="topbar-actions">
          <button className="btn btn-ghost btn-sm" onClick={reload}><RefreshCw size={14}/></button>
          <button className="btn btn-primary btn-sm" onClick={() => { setEditingDeal(null); setDefaultStage(stagesForPipeline[0]); setShowDealModal(true) }}>
            <Plus size={14}/> Add Deal
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="page-content" style={{display:'flex',gap:0,padding:'16px',overflow:'auto'}}>
        {loading ? (
          <div className="empty-state"><p>Loading pipeline…</p></div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="pipeline-board">
              {stagesForPipeline.map(stage => (
                <StageColumn key={stage.id} stage={stage}
                  deals={getDealsForStage(stage.id)}
                  onDealClick={handleDealClick}
                  onAddDeal={handleAddDeal}/>
              ))}
              <button className="pipeline-add-col" onClick={() => {}}>
                <Plus size={16}/> Add Stage
              </button>
            </div>
            <DragOverlay>
              {activeDeal && (
                <div className="deal-card" style={{transform:'rotate(2deg)',boxShadow:'0 10px 25px rgba(0,0,0,.2)',cursor:'grabbing'}}>
                  <div className="deal-card-title">{activeDeal.title}</div>
                  <div className="deal-card-value" style={{marginTop:4}}>{fmt(activeDeal.value)}</div>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {showDealModal && (
        <DealModal
          deal={editingDeal}
          defaultStage={defaultStage}
          pipelines={pipelines}
          onSave={handleDealSaved}
          onClose={() => setShowDealModal(false)}/>
      )}
    </div>
  )
}
