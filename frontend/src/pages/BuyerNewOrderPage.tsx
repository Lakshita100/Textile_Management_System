import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck } from 'lucide-react'
import { buttonClass } from '../components/ui/Button'
import { getBuyerById, getCurrentSession, submitBuyerOrder } from '../services/orderService'
import { isFullContactName } from '../services/locationService'
import { getBuyerFabricCatalog, getBuyerYarnCatalog } from '../services/authService'
import type { BuyerFabricCatalogItem, BuyerYarnCatalogItem } from '../services/authService'

type OrderForm = {
  productCategory: string
  productName: string
  yarnType: string
  yarnSubtype: string
  productCode: string
  yarnId: string
  materialComposition: string
  technicalSpecifications: string
  denierCount: string
  shade: string
  specialRequirements: string
  quantity: string
  unit: 'kg' | 'metres'
  priority: 'Standard' | 'Urgent' | 'Flexible'
  requestedDeliveryDate: string
  deliveryAddress: string
  deliveryInstructions: string
  targetPrice: string
  buyerNotes: string
}

const inputClass = 'h-11 w-full rounded-xl border border-line bg-canvas px-3 text-sm text-ink'
const earliestDeliveryDate = new Date().toISOString().slice(0, 10)

export default function BuyerNewOrderPage() {
  const session = getCurrentSession()
  const buyer = session ? getBuyerById(session.userId) : undefined
  const [step, setStep] = useState<'form' | 'review' | 'submitted'>('form')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submittedOrderId, setSubmittedOrderId] = useState('')
  const [form, setForm] = useState<OrderForm>({
    productCategory: '',
    productName: '',
    yarnType: '',
    yarnSubtype: '',
    productCode: '',
    yarnId: '',
    materialComposition: '',
    technicalSpecifications: '',
    denierCount: '',
    shade: '',
    specialRequirements: '',
    quantity: '',
    unit: 'kg',
    priority: 'Standard',
    requestedDeliveryDate: '',
    deliveryAddress: [buyer?.address, buyer?.city, buyer?.country].filter(Boolean).join(', '),
    deliveryInstructions: '',
    targetPrice: '',
    buyerNotes: '',
  })

  const [yarnCatalog, setYarnCatalog] = useState<BuyerYarnCatalogItem[]>([])
  const [fabricCatalog, setFabricCatalog] = useState<BuyerFabricCatalogItem[]>([])
  const [catalogError, setCatalogError] = useState('')
  const [catalogLoading, setCatalogLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([getBuyerYarnCatalog(), getBuyerFabricCatalog()])
      .then(([yarns, fabrics]) => {
        if (active) {
          setYarnCatalog(yarns)
          setFabricCatalog(fabrics)
        }
      })
      .catch((error: unknown) => {
        if (active) setCatalogError(error instanceof Error ? error.message : 'Could not load the product catalog.')
      })
      .finally(() => { if (active) setCatalogLoading(false) })
    return () => { active = false }
  }, [])

  const yarnTypes = useMemo(() => [...new Set(yarnCatalog.map((item) => item.category))].sort(), [yarnCatalog])
  const yarnSubtypes = useMemo(() => [...new Set(yarnCatalog
    .filter((item) => !form.yarnType || item.category === form.yarnType)
    .map((item) => `${item.materialComposition} · ${item.denierSpecification}`))].sort(), [form.yarnType, yarnCatalog])
  const matchingYarns = useMemo(() => yarnCatalog.filter((item) =>
    (!form.yarnType || item.category === form.yarnType)
    && (!form.yarnSubtype || `${item.materialComposition} · ${item.denierSpecification}` === form.yarnSubtype),
  ), [form.yarnSubtype, form.yarnType, yarnCatalog])
  const matchingFabrics = useMemo(() => fabricCatalog.filter((item) =>
    !form.yarnType || item.fabricCategory === form.yarnType,
  ), [fabricCatalog, form.yarnType])

  const setField = <K extends keyof OrderForm>(field: K, value: OrderForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const continueToReview = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (!session || session.role !== 'buyer') {
      setError('Your buyer session has expired. Please sign in again before placing an order.')
      return
    }
    if (!buyer?.companyName.trim() || !isFullContactName(buyer.contactName) || !buyer.email.trim() || !/^\+\d{1,4}\s\d{10}$/.test(buyer.phone) || !buyer.address.trim() || !buyer.city.trim() || !buyer.country.trim() || !buyer.postalCode?.trim()) {
      setError('Your buyer details are incomplete. Fill in your contact and delivery information before placing an order.')
      return
    }
    if (form.productCategory === 'Yarn' && !form.yarnId) {
      setError('Select an available yarn product from the inventory catalog.')
      return
    }
    if (Number(form.quantity) <= 0) {
      setError('Enter a quantity greater than zero.')
      return
    }
    setStep('review')
  }

  const submitOrder = async () => {
    if (submitting || !session || session.role !== 'buyer') return
    setSubmitting(true)
    setError('')
    try {
      const order = await submitBuyerOrder({
        productName: form.productName.trim(),
        productCode: form.productCode.trim() || 'Not provided',
        ...(form.yarnId ? { yarnId: form.yarnId } : {}),
        productCategory: form.productCategory,
        yarnType: form.yarnType,
        yarnSubtype: form.yarnSubtype.trim(),
        materialComposition: form.materialComposition.trim(),
        technicalSpecifications: form.technicalSpecifications.trim(),
        denierCount: form.denierCount.trim(),
        shade: form.shade.trim(),
        specialRequirements: form.specialRequirements.trim(),
        quantity: Number(form.quantity),
        unit: form.unit,
        priority: form.priority,
        requestedDeliveryDate: form.requestedDeliveryDate,
        deliveryAddress: form.deliveryAddress.trim(),
        deliveryInstructions: form.deliveryInstructions.trim(),
        targetPrice: form.targetPrice.trim(),
        buyerNotes: form.buyerNotes.trim(),
        technicalNotes: [form.technicalSpecifications, form.denierCount ? `Denier/count: ${form.denierCount}` : '', form.specialRequirements]
          .filter(Boolean)
          .join('\n'),
        commercialNotes: form.targetPrice ? `Target price / quotation request: ${form.targetPrice}` : 'Quotation requested.',
      })
      setSubmittedOrderId(order.id)
      setStep('submitted')
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The order could not be submitted. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!buyer) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        <h1 className="text-xl font-bold text-ink">Buyer profile unavailable</h1>
        <p className="mt-2 text-sm text-muted">Sign in with a buyer account to place an order.</p>
        <Link to="/login" className={`${buttonClass('primary', 'md')} mt-5`}>Sign in</Link>
      </div>
    )
  }

  if (step === 'submitted') {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-surface p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.18em] text-success">Order request submitted</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">We have received your requirements</h1>
        <p className="mt-3 text-sm text-muted">Ram will review the request. Material availability has not been checked yet.</p>
        <p className="mt-5 rounded-xl bg-canvas p-4 text-lg font-bold text-primary">Order ID: {submittedOrderId}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to={`/buyer/orders/${submittedOrderId}`} className={buttonClass('primary', 'md')}>View order</Link>
          <Link to="/buyer/orders" className={buttonClass('secondary', 'md')}>My orders</Link>
        </div>
      </div>
    )
  }

  const reviewRows: Array<[string, string]> = [
    ['Buyer', buyer.companyName],
    ['Contact', `${buyer.contactName} · ${buyer.email} · ${buyer.phone}`],
    ['Category / product', `${form.productCategory} · ${form.productName}`],
    ['Yarn', `${form.yarnType}${form.yarnSubtype ? ` / ${form.yarnSubtype}` : ''}`],
    ['Product code', form.productCode || 'Not provided'],
    ['Composition', form.materialComposition],
    ['Technical specifications', form.technicalSpecifications || 'Not provided'],
    ['Denier / count', form.denierCount || 'Not applicable'],
    ['Colour / shade', form.shade],
    ['Special requirements', form.specialRequirements || 'None'],
    ['Quantity', `${form.quantity} ${form.unit} · ${form.priority} priority`],
    ['Requested delivery', form.requestedDeliveryDate],
    ['Delivery address', form.deliveryAddress],
    ['Delivery instructions', form.deliveryInstructions || 'None'],
    ['Target price / quotation', form.targetPrice || 'Please provide a quotation'],
    ['Buyer notes', form.buyerNotes || 'None'],
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <Link to="/buyer/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><ArrowLeft className="h-4 w-4" /> My Orders</Link>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Buyer order request</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">Place a new order</h1>
            <p className="mt-1 text-sm text-muted">Provide your requirements for Ram’s review. Submission does not approve or reserve material.</p>
          </div>
          <span className="hidden rounded-full bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary sm:inline-flex">
            {step === 'form' ? '1 of 2 · Requirements' : '2 of 2 · Review'}
          </span>
        </div>
      </div>

      {step === 'form' ? (
        <form onSubmit={continueToReview} className="space-y-5">
          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Buyer details</h2>
            <p className="mt-1 text-sm text-muted">These details come from your buyer profile.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <ReadOnlyField label="Company" value={buyer.companyName} />
              <ReadOnlyField label="Contact person" value={buyer.contactName} />
              <ReadOnlyField label="Business email" value={buyer.email} />
              <ReadOnlyField label="Phone" value={buyer.phone} />
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Product requirements</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Product category" required>
                <select required value={form.productCategory} onChange={(event) => setForm((current) => ({ ...current, productCategory: event.target.value, unit: event.target.value === 'Fabric' ? 'kg' : current.unit, productName: '', yarnId: '', productCode: '', yarnType: '', yarnSubtype: '', materialComposition: '', denierCount: '', shade: '' }))} className={inputClass}>
                  <option value="">Select a category</option><option>Yarn</option><option>Fabric</option><option>Garment / made-up</option><option>Other textile</option>
                </select>
              </Field>
              {form.productCategory === 'Yarn' ? <>
                <Field label="Yarn type" required>
                  <select required value={form.yarnType} onChange={(event) => setForm((current) => ({ ...current, yarnType: event.target.value, yarnSubtype: '', yarnId: '', productName: '', productCode: '', materialComposition: '', denierCount: '', shade: '' }))} className={inputClass}>
                    <option value="">{catalogLoading ? 'Loading yarn types…' : 'Select yarn type'}</option>
                    {yarnTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </Field>
                <Field label="Yarn subtype / composition" required>
                  <select required value={form.yarnSubtype} onChange={(event) => setForm((current) => ({ ...current, yarnSubtype: event.target.value, yarnId: '', productName: '', productCode: '' }))} className={inputClass}>
                    <option value="">Select a valid type and composition</option>
                    {yarnSubtypes.map((subtype) => <option key={subtype} value={subtype}>{subtype}</option>)}
                  </select>
                </Field>
                <Field label="Product name" required>
                  <select required value={form.yarnId} onChange={(event) => {
                    const item = yarnCatalog.find((candidate) => candidate.yarnId === event.target.value)
                    setForm((current) => ({
                      ...current,
                      yarnId: item?.yarnId ?? '',
                      productName: item?.yarnName ?? '',
                      productCode: item?.productCode ?? '',
                      yarnType: item?.category ?? current.yarnType,
                      yarnSubtype: item ? `${item.materialComposition} · ${item.denierSpecification}` : current.yarnSubtype,
                      materialComposition: item?.materialComposition ?? '',
                      denierCount: item?.denierSpecification ?? '',
                      shade: item?.colourShade ?? '',
                      unit: item?.unit.toLowerCase().includes('meter') ? 'metres' : 'kg',
                    }))
                  }} className={inputClass}>
                    <option value="">{!form.yarnType || !form.yarnSubtype ? 'Choose yarn type and subtype first' : 'Select product'}</option>
                    {matchingYarns.map((item) => <option key={item.yarnId} value={item.yarnId}>{item.yarnName} ({item.productCode})</option>)}
                  </select>
                </Field>
                {catalogError ? <p role="alert" className="sm:col-span-2 rounded-lg bg-error/5 p-3 text-sm text-error">{catalogError}</p> : null}
                {!catalogLoading && !yarnCatalog.length ? <p className="sm:col-span-2 text-sm text-muted">No yarn products are currently listed in inventory.</p> : null}
              </> : form.productCategory === 'Fabric' ? <>
                <Field label="Fabric category" required>
                  <select required value={form.yarnType} onChange={(event) => setForm((current) => ({ ...current, yarnType: event.target.value, productName: '', productCode: '', materialComposition: '', technicalSpecifications: '' }))} className={inputClass}>
                    <option value="">{catalogLoading ? 'Loading fabric categories…' : 'Select a fabric category'}</option>
                    {[...new Set(fabricCatalog.map((item) => item.fabricCategory))].sort().map((category) => <option key={category}>{category}</option>)}
                  </select>
                </Field>
                <Field label="Fabric product" required>
                  <select required value={form.productCode} onChange={(event) => {
                    const item = fabricCatalog.find((candidate) => candidate.recipeCode === event.target.value)
                    setForm((current) => ({
                      ...current,
                      productName: item?.fabricName ?? '',
                      productCode: item?.recipeCode ?? '',
                      materialComposition: item?.ingredients.map((ingredient) => `${ingredient.yarnType} ${ingredient.specification}`).join(' + ') ?? '',
                      technicalSpecifications: item?.construction ?? '',
                    }))
                  }} className={inputClass}>
                    <option value="">Select a fabric recipe</option>
                    {matchingFabrics.map((item) => <option key={item.recipeCode} value={item.recipeCode}>{item.fabricName} ({item.recipeCode})</option>)}
                  </select>
                </Field>
                {!catalogLoading && !fabricCatalog.length ? <p className="sm:col-span-2 text-sm text-muted">No active fabric recipes are listed in inventory.</p> : null}
              </> : <Field label="Product name" required><input required value={form.productName} onChange={(event) => setField('productName', event.target.value)} className={inputClass} placeholder="Enter requested product" /></Field>}
              {form.productCategory !== 'Yarn' && form.productCategory !== 'Fabric' ? <Field label="Product code (if available)"><input value={form.productCode} onChange={(event) => setField('productCode', event.target.value)} className={inputClass} /></Field> : null}
              {form.productCategory !== 'Fabric' ? <Field label="Material composition" required><input required value={form.materialComposition} onChange={(event) => setField('materialComposition', event.target.value)} className={inputClass} placeholder="e.g. 100% organic cotton" /></Field> : null}
              <Field label="Denier / count (if applicable)"><input value={form.denierCount} onChange={(event) => setField('denierCount', event.target.value)} className={inputClass} placeholder="e.g. 30s Ne / 150D" /></Field>
              <Field label="Colour / shade" required><input required value={form.shade} onChange={(event) => setField('shade', event.target.value)} className={inputClass} placeholder="Name or shade reference" /></Field>
              <Field label="Technical specifications" className="sm:col-span-2"><textarea value={form.technicalSpecifications} onChange={(event) => setField('technicalSpecifications', event.target.value)} rows={3} className={`${inputClass} h-auto py-2`} placeholder="Twist, finish, tolerances, construction or other specifications" /></Field>
              <Field label="Special requirements" className="sm:col-span-2"><textarea value={form.specialRequirements} onChange={(event) => setField('specialRequirements', event.target.value)} rows={2} className={`${inputClass} h-auto py-2`} /></Field>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Quantity & delivery</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Required quantity" required><input required type="number" min="0.01" step="any" value={form.quantity} onChange={(event) => setField('quantity', event.target.value)} className={inputClass} /></Field>
              <Field label="Unit" required><select value={form.unit} onChange={(event) => setField('unit', event.target.value as OrderForm['unit'])} className={inputClass}><option value="kg">kg</option><option value="metres" disabled={form.productCategory === 'Fabric'}>metres</option></select>{form.productCategory === 'Fabric' ? <span className="mt-1 block text-xs text-muted">Fabric recipe ingredients are defined in kg, so this order is measured in kg.</span> : null}</Field>
              <Field label="Order priority"><select value={form.priority} onChange={(event) => setField('priority', event.target.value as OrderForm['priority'])} className={inputClass}><option>Standard</option><option>Urgent</option><option>Flexible</option></select></Field>
              <Field label="Requested delivery date" required><input required type="date" min={earliestDeliveryDate} value={form.requestedDeliveryDate} onChange={(event) => setField('requestedDeliveryDate', event.target.value)} className={inputClass} /></Field>
              <Field label="Delivery address" required className="sm:col-span-2"><textarea required rows={2} value={form.deliveryAddress} onChange={(event) => setField('deliveryAddress', event.target.value)} className={`${inputClass} h-auto py-2`} /></Field>
              <Field label="Delivery instructions" className="sm:col-span-2"><textarea rows={2} value={form.deliveryInstructions} onChange={(event) => setField('deliveryInstructions', event.target.value)} className={`${inputClass} h-auto py-2`} /></Field>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
            <h2 className="text-lg font-semibold text-ink">Commercial & additional information</h2>
            <div className="mt-4 grid gap-4">
              <Field label="Target price or quotation request"><input value={form.targetPrice} onChange={(event) => setField('targetPrice', event.target.value)} className={inputClass} placeholder="Optional target price; leave blank to request a quotation" /></Field>
              <Field label="Buyer notes"><textarea rows={3} value={form.buyerNotes} onChange={(event) => setField('buyerNotes', event.target.value)} className={`${inputClass} h-auto py-2`} placeholder="Anything else Ram should consider" /></Field>
            </div>
            <p className="mt-3 text-xs text-muted">File attachments are not supported by this local demo. Add colour-reference or specification details in the notes above.</p>
          </section>

          {error ? <div role="alert" className="rounded-xl border border-error/40 bg-error/5 p-3 text-sm font-medium text-error"><p>{error}</p>{error.includes('buyer details') ? <Link to="/buyer/profile" className="mt-2 inline-block font-semibold underline">Complete buyer details</Link> : null}</div> : null}
          <div className="flex justify-end">
            <button type="submit" className={buttonClass('primary', 'md')}>Review order <ArrowRight className="h-4 w-4" /></button>
          </div>
        </form>
      ) : (
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
          <div className="flex items-start gap-3">
            <ClipboardCheck className="mt-1 h-5 w-5 text-primary" />
            <div><h2 className="text-lg font-semibold text-ink">Review & submit</h2><p className="mt-1 text-sm text-muted">Check these requirements before sending them to Ram. You can return to edit any detail.</p></div>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            {reviewRows.map(([label, value]) => <div key={label} className="rounded-xl bg-canvas p-3"><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm text-ink">{value || 'Not provided'}</dd></div>)}
          </dl>
          <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm text-muted">Submitting creates an order request in <strong className="text-ink">Submitted</strong> status. Material availability remains unchecked until Ram records a check.</p>
          {error ? <p role="alert" className="mt-4 rounded-xl border border-error/40 bg-error/5 p-3 text-sm font-medium text-error">{error}</p> : null}
          <div className="mt-5 flex flex-col-reverse justify-end gap-3 sm:flex-row">
            <button type="button" onClick={() => setStep('form')} className={buttonClass('secondary', 'md')}>Edit requirements</button>
            <button type="button" disabled={submitting} onClick={submitOrder} className={buttonClass('primary', 'md', 'disabled:cursor-not-allowed disabled:opacity-60')}>{submitting ? 'Submitting…' : 'Submit order request'}</button>
          </div>
        </section>
      )}
    </div>
  )
}

function Field({ label, required, className = '', children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return <label className={`block ${className}`}><span className="mb-2 block text-sm font-medium text-ink">{label}{required ? <span className="ml-1 text-error">*</span> : null}</span>{children}</label>
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return <div><p className="mb-2 text-sm font-medium text-ink">{label}</p><div className={`${inputClass} flex items-center bg-canvas/70 text-muted`}>{value}</div></div>
}
