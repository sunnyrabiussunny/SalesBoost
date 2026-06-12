import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList } from 'recharts'
import api from '../api'

const COLORS = ['#3b6ef8','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899'];

function fmt(v) {
  if (!v && v !== 0) return '$0'
  if (v >= 1000000) return `$${(v/1000000).toFixed(1)}M`
  if (v >= 1000) return `$${(v/1000).toFixed(0)}K`
  return `$${Number(v).toFixed(0)}`
}

export default function ReportsPage() {
  const [summary, setSummary] = useState(null)
  const [funnel, setFunnel] = useState([])
  const [dealsOverTime, setDealsOverTime] = useState([])
  const [activityTypes, setActivityTypes] = useState([])
  const [byOwner, setByOwner] = useState([])
  const [pipelines, setPipelines] = useState([])
  const [selectedPipeline, setSelectedPipeline] = useState('')
  const [forecast, setForecast] = useState([])

  useEffect(() => {
    api.get('/pipelines').then(r => {
      setPipelines(r.data)
      if (r.data.length) setSelectedPipeline(r.data[0].id)
    })
    api.get('/reports/deals-over-time').then(r => setDealsOverTime(r.data))
    api.get('/reports/activities-by-type').then(r => setActivityTypes(r.data))
    api.get('/reports/deals-by-owner').then(r => setByOwner(r.data))
    api.get('/reports/revenue-forecast').then(r => setForecast(r.data))
  }, [])

  useEffect(() => {
    if (!selectedPipeline) return
    api.get(`/reports/summary?pipeline_id=${selectedPipeline}`).then(r => setSummary(r.data))
    api.get(`/reports/funnel?pipeline_id=${selectedPipeline}`).then(r => setFunnel(r.data))
  }, [selectedPipeline])

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="topbar">
        <h2>Insights & Reports</h2>
        <div className="topbar-actions">
          <select className="form-control" style={{width:180}} value={selectedPipeline} onChange={e=>setSelectedPipeline(e.target.value)}>
            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
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
            <div className="stat-label">Contacts</div>
            <div className="stat-value">{summary?.contacts?.total || 0}</div>
            <div className="stat-sub">{summary?.organizations?.total || 0} organizations</div>
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
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} margin={{top:10,right:10,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                  <XAxis dataKey="name" tick={{fontSize:11}}/>
                  <YAxis tick={{fontSize:11}}/>
                  <Tooltip formatter={(v,name) => name==='value' ? fmt(v) : v}/>
                  <Bar dataKey="deals" fill="#3b6ef8" radius={[4,4,0,0]}>
                    <LabelList dataKey="deals" position="top" fontSize={11}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Deals Started vs Won (monthly)</span></div>
            <div className="card-body" style={{height:280}}>
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
            </div>
          </div>
        </div>

        {/* Activities by type + Revenue forecast */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <div className="card">
            <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Activities by Type</span></div>
            <div className="card-body" style={{height:280,display:'flex',alignItems:'center'}}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={activityTypes} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={90} label={({type,count})=>`${type}: ${count}`} fontSize={11}>
                    {activityTypes.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span style={{fontWeight:600,fontSize:14}}>Revenue Forecast (Weighted)</span></div>
            <div className="card-body" style={{height:280}}>
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
            </div>
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
