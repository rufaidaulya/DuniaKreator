import React, { useState, useEffect, useCallback } from 'react';
import { getSavedProducts, deleteProduct, SavedProduct, MAX_PRODUCTS } from '../utils/localStorage';
import { TrashIcon, ClipboardIcon, PackageIcon, XIcon } from '../components/IconComponents';

const ProductPreviewModal: React.FC<{
    product: SavedProduct;
    onClose: () => void;
}> = ({ product, onClose }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(product.dna);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-brand-bg-light w-full max-w-lg lg:max-w-3xl rounded-2xl border border-brand-border shadow-2xl flex flex-col md:flex-row animate-fade-in max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="w-full md:w-1/2 flex items-center justify-center p-4 bg-brand-bg-dark rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-auto max-h-full object-contain rounded-lg" />
                </div>
                <div className="p-6 flex flex-col flex-grow overflow-y-auto w-full md:w-1/2">
                    <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold text-brand-text-primary mb-2">{product.name}</h2>
                        <button onClick={onClose} className="text-brand-text-secondary hover:text-white transition-colors">
                            <XIcon className="w-6 h-6"/>
                        </button>
                    </div>
                    <p className="text-sm font-semibold text-brand-text-secondary mb-2">DNA Produk</p>
                    <textarea 
                        readOnly 
                        value={product.dna}
                        className="w-full h-full flex-grow bg-brand-bg-dark border border-brand-border rounded-lg p-3 text-brand-text-primary text-sm resize-none mb-4 whitespace-pre-wrap break-words"
                        rows={6}
                    />
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center justify-center gap-2 bg-brand-blue hover:bg-brand-blue-dark text-white font-bold py-2.5 px-4 rounded-lg transition-colors mt-auto"
                    >
                        <ClipboardIcon className="w-4 h-4"/>
                        {copied ? 'Tersalin!' : 'Salin DNA'}
                    </button>
                </div>
            </div>
        </div>
    );
}

const SavedProductsPage: React.FC = () => {
  const [savedProducts, setSavedProducts] = useState<SavedProduct[]>([]);
  const [previewProduct, setPreviewProduct] = useState<SavedProduct | null>(null);

  useEffect(() => {
      setSavedProducts(getSavedProducts());
  }, []);

  const handleDeleteProduct = useCallback((e: React.MouseEvent, productId: string) => {
      e.stopPropagation();
      if (window.confirm("Apakah Anda yakin ingin menghapus produk ini?")) {
        deleteProduct(productId);
        setSavedProducts(currentProducts => currentProducts.filter(product => product.id !== productId));
      }
  }, []);
  
  return (
    <div className="w-full h-full flex flex-col animate-fade-in">
      <header className="w-full max-w-6xl text-center mb-10 mx-auto">
        <div className="flex items-center justify-center gap-3 mb-2">
            <PackageIcon className="w-8 h-8 text-green-400" />
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-teal-500">
                Produk Tersimpan ({savedProducts.length}/{MAX_PRODUCTS})
            </h1>
        </div>
        <p className="text-md sm:text-lg text-brand-text-secondary max-w-3xl mx-auto">
            Kelola produk yang telah Anda buat. Anda dapat menggunakan kembali produk ini untuk membuat iklan dengan berbagai model avatar.
        </p>
      </header>

      <main className="w-full max-w-7xl mx-auto flex-grow">
        {savedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-brand-text-secondary mt-16">
                <PackageIcon className="w-24 h-24 mb-6 opacity-30"/>
                <h2 className="text-2xl font-bold text-brand-text-primary mb-2">Belum Ada Produk yang Disimpan</h2>
                <p className="mt-2 max-w-md">
                    Pergi ke halaman "Buat Iklan Produk", hasilkan gambar produk (tanpa avatar), lalu simpan. Produk akan muncul di sini.
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                {savedProducts.map(product => (
                    <div 
                        key={product.id} 
                        onClick={() => setPreviewProduct(product)}
                        className="group bg-brand-bg-light border border-brand-border rounded-xl shadow-lg transition-transform duration-300 hover:-translate-y-1 flex flex-col cursor-pointer"
                    >
                        <div className="relative">
                            <img src={product.imageUrl} alt={`Saved product ${product.name}`} className="w-full h-auto aspect-[16/9] object-cover rounded-t-xl" />
                            <button
                                onClick={(e) => handleDeleteProduct(e, product.id)}
                                className="absolute top-2 right-2 bg-red-600/70 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100 z-10"
                                aria-label="Delete product"
                            >
                                <TrashIcon className="w-4 h-4"/>
                            </button>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className="p-3 text-center">
                            <p className="text-brand-text-primary font-semibold truncate text-sm" title={product.name}>{product.name}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </main>
      {previewProduct && <ProductPreviewModal product={previewProduct} onClose={() => setPreviewProduct(null)} />}
    </div>
  );
};

export default SavedProductsPage;