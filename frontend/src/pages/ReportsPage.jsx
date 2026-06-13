import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts'
import api from '../api'

const COLORS = ['#3b6ef8','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16'];

function fmt(v) {
  if (!v && v !== 0) return '$0'
  if (v >= 1000000) return `$${(v/1000000).toFixed(1)}M`
  if (v >= 1000) return `$${(v/1000).toFixed(0)}K`
  return `$${Number(v).toFixed(0)}`
}

function EmptyChart({ text = 'No data for this selection' }) {
  return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#9ca3af',fontSize:13}}>{text}</div>
}

export default function ReportsPage() {
  const [pipelines, setPipelines] = useState([])
  const [users, setUsers] = useState([])
  const [filters, setFilters] = useState({ pipeline_id: '', owner_id: '', date_from: '', date_to: '' })

  const [summary, setSummary] = useState(null)
  const [funnel, setFunnel] = useState([])
  const [dealsOverTime, setDealsOverTime] = useState([])
  const [activityTypes, setActivityTypes] = useState([])
  const [byOwner, setByOwner] = useState([])
  const [forecast, setForecast] = useState([])
  const [lostReasons, setLostReasons] = useState([])
  const [topOrgs, setTopOrgs] = useState([])
  const [byLabel, setByLabel] = useState([])

  useEffect(() => {
    api.get('/pipelines').then(r => {
      setPipelines(r.data)
      if (r.data.length) setFilters(f => ({ ...f, pipeline_id: r.data[0].id }))
    })
    api.get('/users').then(r => setUsers(r.data))
  }, [])

  useEffect(() => {
    if (!filters.pipeline_id) return
    const params = new URLSearchParams()
    if (filters.pipeline_id) params.set('pipeline_id', filters.pipeline_id)
    if (filters.owner_id) params.set('owner_id', filters.owner_id)
    if (filters.date_from) params.set('date_from', filters.date_from)
    if (filters.date_to) params.set('date_to', filters.date_to)
    const qs = params.toString()

    const pipelineOnly = new URLSearchParams()
    if (filters.pipeline_id) pipelineOnly.set('pipeline_id', filters.pipeline_id)
    if (filters.date_from) pipelineOnly.set('date_from', filters.date_from)
    if (filters.date_to) pipelineOnly.set('date_to', filters.date_to)

    api.get(`/reports/summary?${qs}`).then(r => setSummary(r.data))
    api.get(`/reports/funnel?${qs}`).then(r => setFunnel(r.data))
    api.get(`/reports/deals-over-time?${qs}`).then(r => setDealsOverTime(r.data))
    api.get(`/reports/activities-by-type?${qs}`).then(r => setActivityTypes(r.data))
    api.get(`/reports/deals-by-owner?${pipelineOnly}`).then(r => setByOwner(r.data))
    api.get(`/reports/revenue-forecast?${qs}`).then(r => setForecast(r.data))
    api.get(`/reports/lost-reasons?${qs}`).then(r => setLostReasons(r.data))
    api.get(`/reports/top-organizations?${qs}`).then(r => setTopOrgs(r.data))
    api.get(`/reports/deals-by-label?${qs}`).then(r => setByLabel(r.data))
  }, [filters])

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))
  const clearFilters = () => setFilters(f => ({ pipeline_id: f.pipeline_id, owner_id: '', date_from: '', date_to: '' }))
  const hasExtraFilters = filters.owner_id || filters.date_from || filters.date_to

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="topbar">
        <h2>Insights & Reports</h2>
        <div className="topbar-actions" style={{flexWrap:'wrap'}}>
          <select className="form-control" style={{width:160}} value={filters.pipeline_id} onChange={e=>setFilter('pipeline_id', e.target.value)}>
            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="form-control" style={{width:150}} value={filters.owner_id} onChange={e=>setFilter('owner_id', e.target.value)}>
            <option value="">All Owners</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input className="form-control" style={{width:140}} type="date" value={filters.date_from} onChange={e=>setFilter('date_from', e.target.value)} title="From date"/>
          <input className="form-control" style={{width:140}} type="date" value={filters.date_to} onChange={e=>setFilter('date_to', e.target.value)} title="To date"/>
          {hasExtraFilters && <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>}
        </div>
      </div>
      <div className="page-content">
        {/* KPI cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Open Pipeline Value</div>
            <div className="stat-value">{fmt(summary?.deals?.pipeline_value)}</div>
            <div className="stat-sub">{summary?.deals?.open_deals || 0} open deals</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Won Revenue</div>
            <div className="stat-value" style={{color:'var(--success)'}}>{fmt(summary?.deals?.won_value)}</div>
            <div className="stat-sub">{summary?.deals?.won_deals || 0} deals won</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg Deal Size (Won)</div>
            <div className="stat-value">{fmt(summary?.deals?.avg_deal_size)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Lost Deals</div>
            <div className="stat-value" style={{color:'var(--danger)'}}>{summary?.deals?.lost_deals || 0}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Activities</div>
            <div className="stat-value">{summary?.activities?.total || 0}</div>
            <div className="stat-sub">{summary?.activities?.pending || 0} pending</div>
          </div>
        </div>

        {/* Funnel + Deals over time */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <div className="card">
            <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Conversion Funnel</span></div>
            <div className="card-body" style={{height:280}}>
              {funnel.length === 0 ? <EmptyChart/> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnel} margin={{top:10,right:10,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="name" tick={{fontSize:11}}/>
                    <YAxis tick={{fontSize:11}}/>
                    <Tooltip/>
                    <Bar dataKey="deals" fill="#3b6ef8" radius={[4,4,0,0]}>
                      <LabelList dataKey="deals" position="top" fontSize={11}/>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Deals Started vs Won (monthly)</span></div>
            <div className="card-body" style={{height:280}}>
              {dealsOverTime.length === 0 ? <EmptyChart/> : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dealsOverTime} margin={{top:10,right:10,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="month" tick={{fontSize:11}}/>
                    <YAxis tick={{fontSize:11}}/>
                    <Tooltip/>
                    <Legend wrapperStyle={{fontSize:12}}/>
                    <Line type="monotone" dataKey="started" stroke="#3b6ef8" strokeWidth={2} name="Started"/>
                    <Line type="monotone" dataKey="won" stroke="#22c55e" strokeWidth={2} name="Won"/>
                    <Line type="monotone" dataKey="lost" stroke="#ef4444" strokeWidth={2} name="Lost"/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Activities by type + Revenue forecast */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <div className="card">
            <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Activities by Type</span></div>
            <div className="card-body" style={{height:280,display:'flex',alignItems:'center'}}>
              {activityTypes.length === 0 ? <EmptyChart/> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={activityTypes} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={90} label={({type,count})=>`${type}: ${count}`} fontSize={11}>
                      {activityTypes.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Tooltip/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Revenue Forecast (Weighted)</span></div>
            <div className="card-body" style={{height:280}}>
              {forecast.length === 0 ? <EmptyChart/> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={forecast} margin={{top:10,right:10,left:0,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                    <XAxis dataKey="month" tick={{fontSize:11}}/>
                    <YAxis tick={{fontSize:11}} tickFormatter={fmt}/>
                    <Tooltip formatter={fmt}/>
                    <Legend wrapperStyle={{fontSize:12}}/>
                    <Bar dataKey="total_value" fill="#dbeafe" name="Total Value" radius={[4,4,0,0]}/>
                    <Bar dataKey="weighted_value" fill="#3b6ef8" name="Weighted (by probability)" radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Lost reasons + Deals by label */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <div className="card">
            <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Lost Deal Reasons</span></div>
            <div className="card-body" style={{height:280}}>
              {lostReasons.length === 0 ? <EmptyChart text="No lost deals with a reason recorded"/> : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lostReasons} layout="vertical" margin={{top:10,right:20,left:10,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                    <XAxis type="number" tick={{fontSize:11}}/>
                    <YAxis type="category" dataKey="reason" tick={{fontSize:11}} width={120}/>
                    <Tooltip formatter={(v,name)=>name==='value'?fmt(v):v}/>
                    <Bar dataKey="count" fill="#ef4444" radius={[0,4,4,0]} name="Deals"/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Deal Value by Label</span></div>
            <div className="card-body" style={{height:280,display:'flex',alignItems:'center'}}>
              {byLabel.length === 0 ? <EmptyChart/> : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byLabel} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90} label={({label,value})=>`${label}: ${fmt(value)}`} fontSize={11}>
                      {byLabel.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={fmt}/>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Top organizations */}
        <div className="card mb-4">
          <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Top Organizations by Deal Value</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Organization</th><th>Deals</th><th>Open Value</th><th>Won Value</th><th>Total Value</th></tr></thead>
              <tbody>
                {topOrgs.length === 0 ? (
                  <tr><td colSpan={5} style={{textAlign:'center',padding:30,color:'#9ca3af'}}>No data</td></tr>
                ) : topOrgs.map((o,i) => (
                  <tr key={i}>
                    <td style={{fontWeight:500}}>{o.organization}</td>
                    <td>{o.deal_count}</td>
                    <td>{fmt(o.open_value)}</td>
                    <td style={{color:'var(--success)'}}>{fmt(o.won_value)}</td>
                    <td style={{fontWeight:600}}>{fmt(o.total_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* By owner table */}
        <div className="card">
          <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Performance by Owner</span></div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Owner</th><th>Total Deals</th><th>Open</th><th>Won</th><th>Won Value</th><th>Win Rate</th></tr></thead>
              <tbody>
                {byOwner.map(o => (
                  <tr key={o.owner_id}>
                    <td style={{fontWeight:500}}>{o.owner}</td>
                    <td>{o.total_deals || 0}</td>
                    <td>{o.open_deals || 0}</td>
                    <td>{o.won_deals || 0}</td>
                    <td style={{fontWeight:600}}>{fmt(o.won_value)}</td>
                    <td>{o.win_rate || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
