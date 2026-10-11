import { useNavigate } from 'react-router'

import { createProduct } from '../api/products.js'
import ProductForm from '../components/ProductForm.jsx'
import { cardStyles } from '../components/ui.js'

const CreateProductPage = () => {
  const navigate = useNavigate()

  const handleCreate = async (product) => {
    const created = await createProduct(product)
    navigate('/', { state: { message: `"${created.name}" was created successfully.` } })
  }

  return (
    <section className={`${cardStyles} mx-auto max-w-2xl p-6 sm:p-8`}>
      <h1 className="text-2xl font-bold">Add product</h1>
      <div className="mt-6">
        <ProductForm submitLabel="Create product" cancelTo="/" onSubmit={handleCreate} />
      </div>
    </section>
  )
}

export default CreateProductPage
