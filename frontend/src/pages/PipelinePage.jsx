import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DndContext, DragOverlay, pointerWithin, rectIntersection, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, AlertTriangle, RefreshCw, Pencil } from 'lucide-react'
import api from '../api'
import DealModal from '../components/DealModal'
import StageModal from '../components/StageModal'

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

function StageColumn({ stage, deals, onDealClick, onAddDeal, onEditStage, tourTarget }) {
  const total = deals.reduce((s,d) => s + (d.value||0), 0)
  const { setNodeRef, isOver } = useDroppable({ id: stage.id })
  return (
    <div className="pipeline-column">
      <div className="pipeline-col-header">
        <div>
          <div className="pipeline-col-name">{stage.name}</div>
          <div className="pipeline-col-stats">{fmt(total)} · {stage.probability}% prob.</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span className="pipeline-col-count">{deals.length}</span>
          <button className="btn-icon pipeline-col-edit-btn" title="Edit stage" onClick={()=>onEditStage(stage)} {...(tourTarget ? {'data-tour':tourTarget} : {})}>
            <Pencil size={13}/>
          </button>
        </div>
      </div>
      <SortableContext items={deals.map(d=>d.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={`pipeline-col-body ${isOver ? 'drag-over' : ''}`}>
          {deals.map(d => <DealCard key={d.id} deal={d} onClick={onDealClick}/>)}
          {deals.length === 0 && (
            <div style={{minHeight:60,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)',fontSize:12,border:'2px dashed var(--border)',borderRadius:6}}>
              Drop here
            </div>
          )}
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
  const [stageModal, setStageModal] = useState(null) // { stage: null|stage } or null = closed

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const loadPipelines = (selectId) => {
    api.get('/pipelines').then(r => {
      setPipelines(r.data)
      if (r.data.length) {
        const target = selectId ? r.data.find(p=>p.id===selectId) : r.data.find(p=>p.id===selectedPipeline?.id)
        setSelectedPipeline(target || r.data[0])
      }
    })
  }

  useEffect(() => { loadPipelines() }, [])

  useEffect(() => {
    if (!selectedPipeline) return
    setLoading(true)
    api.get(`/deals?pipeline_id=${selectedPipeline.id}&status=open`).then(r => {
      setDeals(r.data)
      setLoading(false)
    })
  }, [selectedPipeline?.id])

  const reload = () => {
    if (!selectedPipeline) return
    api.get(`/deals?pipeline_id=${selectedPipeline.id}&status=open`).then(r => setDeals(r.data))
  }

  const stagesForPipeline = selectedPipeline?.stages || []
  const stageIdSet = useMemo(() => new Set(stagesForPipeline.map(s => s.id)), [stagesForPipeline])

  // Pointer is checked against both a column's own droppable AND any deal
  // card droppable beneath it. If both match (pointer over a card), prefer
  // the card so within-stage reordering and precise insert position work.
  // If only the column matches (empty space / empty column), fall back to
  // the column itself. If nothing matches (fast drags), fall back to rect overlap.
  const collisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      const cardCollision = pointerCollisions.find(c => !stageIdSet.has(c.id))
      return cardCollision ? [cardCollision] : pointerCollisions
    }
    return rectIntersection(args)
  }

  const getDealsForStage = stageId => deals.filter(d => d.stage_id === stageId).sort((a,b) => a.order_num - b.order_num)

  const handleDragStart = ({ active }) => setActiveId(active.id)

  // Persist new order_num values for a set of deals (used after a reorder)
  const persistOrder = (stageId, orderedDeals) => {
    orderedDeals.forEach((d, i) => {
      if (d.order_num !== i) {
        api.put(`/deals/${d.id}/move`, { stage_id: stageId, order_num: i, pipeline_id: selectedPipeline.id })
      }
    })
  }

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over) return
    const deal = deals.find(d => d.id === active.id)
    if (!deal) return

    let targetStageId = null
    let overDealId = null
    // 1) Dropped directly on a stage's column body (covers empty stages, or empty space below the last card)
    if (stagesForPipeline.find(s => s.id === over.id)) {
      targetStageId = over.id
    } else {
      // 2) Dropped on/near another deal card -> use that deal's stage and position
      const overDeal = deals.find(d => d.id === over.id)
      if (overDeal) { targetStageId = overDeal.stage_id; overDealId = overDeal.id }
    }
    if (!targetStageId) return

    if (deal.stage_id === targetStageId) {
      // Reordering within the same stage
      if (!overDealId || overDealId === deal.id) return
      const stageDeals = getDealsForStage(targetStageId)
      const oldIndex = stageDeals.findIndex(d => d.id === deal.id)
      const newIndex = stageDeals.findIndex(d => d.id === overDealId)
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return

      const reordered = arrayMove(stageDeals, oldIndex, newIndex)
      const orderMap = new Map(reordered.map((d, i) => [d.id, i]))

      setDeals(prev => prev.map(d => orderMap.has(d.id) ? { ...d, order_num: orderMap.get(d.id) } : d))
      persistOrder(targetStageId, reordered)
      return
    }

    // Moving to a different stage: insert at the dropped position (or append if dropped on empty space)
    const sourceStageDeals = getDealsForStage(deal.stage_id).filter(d => d.id !== deal.id)
    const targetStageDeals = getDealsForStage(targetStageId)
    let insertIndex = targetStageDeals.length
    if (overDealId) {
      const idx = targetStageDeals.findIndex(d => d.id === overDealId)
      if (idx !== -1) insertIndex = idx
    }
    const newTargetOrder = [...targetStageDeals.slice(0, insertIndex), deal, ...targetStageDeals.slice(insertIndex)]
    const newTargetOrderMap = new Map(newTargetOrder.map((d, i) => [d.id, i]))

    setDeals(prev => prev.map(d => {
      if (d.id === deal.id) return { ...d, stage_id: targetStageId, order_num: newTargetOrderMap.get(d.id) }
      if (newTargetOrderMap.has(d.id)) return { ...d, order_num: newTargetOrderMap.get(d.id) }
      return d
    }))

    api.put(`/deals/${deal.id}/move`, { stage_id: targetStageId, order_num: newTargetOrderMap.get(deal.id), pipeline_id: selectedPipeline.id })
    persistOrder(targetStageId, newTargetOrder.filter(d => d.id !== deal.id))
    persistOrder(deal.stage_id, sourceStageDeals)
  }

  const handleDealClick = deal => navigate(`/deals/${deal.id}`)

  const handleAddDeal = stage => { setDefaultStage(stage); setEditingDeal(null); setShowDealModal(true) }

  const handleDealSaved = () => { setShowDealModal(false); reload() }

  const handleStageSaved = () => { setStageModal(null); loadPipelines(selectedPipeline.id) }
  const handleStageDeleted = () => { setStageModal(null); loadPipelines(selectedPipeline.id); reload() }

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
          <button className="btn btn-primary btn-sm" data-tour="add-deal-btn" onClick={() => { setEditingDeal(null); setDefaultStage(stagesForPipeline[0]); setShowDealModal(true) }}>
            <Plus size={14}/> Add Deal
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="page-content" style={{display:'flex',gap:0,padding:'16px',overflow:'auto'}}>
        {loading ? (
          <div className="empty-state"><p>Loading pipeline…</p></div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="pipeline-board" data-tour="pipeline-board">
              {stagesForPipeline.map((stage, i) => (
                <StageColumn key={stage.id} stage={stage}
                  deals={getDealsForStage(stage.id)}
                  onDealClick={handleDealClick}
                  onAddDeal={handleAddDeal}
                  onEditStage={(s)=>setStageModal({stage:s})}
                  tourTarget={i === 0 ? 'edit-stage-btn' : null}/>
              ))}
              <button className="pipeline-add-col" onClick={() => setStageModal({stage:null})}>
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

      {stageModal && (
        <StageModal
          pipelineId={selectedPipeline.id}
          stage={stageModal.stage}
          onSave={handleStageSaved}
          onDelete={handleStageDeleted}
          onClose={() => setStageModal(null)}/>
      )}
    </div>
  )
}
