import React,{useEffect, useState} from 'react'
import { useAddress, useDisconnect, useMetamask, useNFTDrop} from "@thirdweb-dev/react";
import { sanityClient, urlFor } from '../../sanity'
import { GetServerSideProps} from 'next'
import { Collection } from '../../typings';
import Link from 'next/link';
import { BigNumber } from 'ethers';
import toast,{Toaster} from 'react-hot-toast'

interface Props{ 
    collection: Collection
}

const NFTDropPage = ({collection}: Props) => {
    const [claimedSupply, setClaimedSupply] = useState<number>(0);
    const [totalSupply, setTotalSupply] = useState<BigNumber>();
    const [price,setprice] = useState<string>()
    const [loading,setLoading] = useState<boolean>(true);
    const nftDrop = useNFTDrop(collection.address);

  // Auth 
  const connectWithMetamask = useMetamask()
  const address = useAddress();
  const disconnect = useDisconnect();

  useEffect(() => { 
    if(!nftDrop){
        return
    }
    const fetchNFTPrice = async () => { 
        const claimConditions = await nftDrop.claimConditions.getAll();
        setprice(claimConditions?.[0].currencyMetadata.displayValue)
    }
    fetchNFTPrice();
  },[nftDrop])

  useEffect(() => { 
    if(!nftDrop){
        return
    }
    const fetchNFTDropData = async () => { 
        setLoading(true);
        const claimed = await nftDrop.getAllClaimed();
        const total = await nftDrop.totalSupply();

        setClaimedSupply(claimed.length);
        setTotalSupply(total);
        setLoading(false);
    }
    fetchNFTDropData();
  },[nftDrop])

  const mintNft = () =>{
    if(!nftDrop|| !address){
        return;
    } 
    const quantity = 1; // how many unique NFTs you want to claim

    setLoading(true);
    const notification = toast.loading('Minting NFT...',{
        style: { background: 'white',color: 'green', fontWeight: 'bolder', fontSize:'17px', padding: '20px'}
    })

    nftDrop.claimTo(address, quantity)
    .then(async(tx) => {
        const receipt = tx[0].receipt
        const claimedTokenId = tx[0].id
        const claimedNFT = await tx[0].data()

        toast('Hooray! You have successfully minted!',{
            duration: 8000,
            style: { background: 'white',
                color: 'green',
                fontWeight: 'bolder', 
                fontSize:'17px', 
                padding: '20px'}
        })
    })
    .catch(err => {
        console.log(err)
        toast('Whoops...Something went wrong!',{
            style: { background: 'white',
            color: 'red',
            fontWeight: 'bolder', 
            fontSize:'17px', 
            padding: '20px'}
        })

    })
    .finally(() => {
        setLoading(false)
        toast.dismiss(notification)
    });
  }

  // --
  return (
    <div className="flex h-screen flex-col lg:grid lg:grid-cols-10">
        <Toaster position="bottom-center" />
        {/* Left */}
        <div className="bg-gradient-to-br from-cyan-800 to-rose-500 lg:col-span-4">
            <div className="flex flex-col items-center justify-center py-2 lg:min-h-screen">
                <div className="bg-gradient-to-br from-yellow-400 to-purple-600 p-2">
                    <img className="w-44 rounded-xl object-cover lg:h-96 lg:w-72" src={urlFor(collection.previewImage).url()}  />
                </div>
                <div className="p-5 text-center space-y-2">
                    <h1 className="text-4xl text-white">{collection.nftcollectionName}</h1>
                    <h2 className="text-xl text-gray-300">{collection.description}</h2>
                </div>
            </div>
        </div>

        {/* Right */}
        <div className='flex flex-1 flex-col p-12 lg:col-span-6'>
            {/* Header */}
            <header className="flex items-center justify-between">
                <Link href={'/'}>
                  <h1 className="w-52 cursor-pointer text-xl font-extralight sm:w-80">THE <span className="font-extrabold underline decoration-pink-600/50">GODFATHER</span> NFT Market Place</h1>
                </Link>
                <button onClick={() =>{ address ? disconnect() : connectWithMetamask()}} className="rounded-full text-white px-4 py-2 text-xs font-bold lg:py-3 lg:px-5 lg:text-base bg-rose-400">{ address ? 'Sign Out' : "Sign In"}</button>
            </header>

            <hr className="my-2 border"/>
            {address && (

                <p className="text-center text-sm text-rose-400">You're logged in with the wallet {address.substring(0,5)}...{address.substring(address.length- 5,address.length)}</p>
            )}

            {/* Content */}

            <div className="mt-10 flex flex-1 flex-col items-center space-y-6 text-center lg:justify-center lg:space-y-0">
                <img className="w-80 object-cover pb-10 lg:h-40" src={urlFor(collection.mainImage).url()} alt="" />
                <h1 className="text-3xl font-bold lg:text-5xl lg:font-extrabold"> {collection.title} </h1>

                {loading? (
                    <p className="animate-bounce pt-2 text-xl text-green-500"> Loading Supply Count... </p>
                ):(
                    <p className="pt-2 text-xl text-green-500"> {claimedSupply} / {totalSupply?.toString()} NFT's claimed </p>
                )}

                {loading && (
                    <img className="h-80 w-80 object-contain" src="https://cdn.hackernoon.com/images/0*4Gzjgh9Y7Gu8KEtZ.gif" />
                )}
            </div>

            {/* Mint Button */}
            <button 
            onClick={mintNft}
            disabled={loading || claimedSupply === totalSupply?.toNumber() || !address} className="font-bold h-16 mt-10 bg-red-600 text-white w-full rounded-full disabled:bg-gray-400">

             {loading ? (
                <>Loading</>
             ):(
                claimedSupply === totalSupply?.toNumber() ? (
                    <>SOLD OUT</>
                ):
                !address ? (
                    <>Sign In to Mint</>
                ):(
                    <span className="font-bold">Mint NFT ({price})</span>
                )
             )}

            </button>
        </div>
    </div>
  )
}

export default NFTDropPage

export const getServerSideProps: GetServerSideProps = async ({params}) => {
    const query = `*[_type == 'collection' && slug.current == $id][0]{
        _id,
        title,
        address,
        description,
        nftcollectionName,
        mainImage {
        asset
      },
        previewImage {
          asset
        },
        slug {
          current
        },
        creator-> {
          _id,
          name,
          address,
          slug {
          current
          },
        },
      }`

      const collection = await sanityClient.fetch(query,{
        id: params?.id
      })

      if(!collection){
        return {
            notFound: true
        }
      }

      return {
        props: {
          collection
        }
      }
}