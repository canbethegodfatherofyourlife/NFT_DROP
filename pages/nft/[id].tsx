import React from 'react'
import { useAddress, useDisconnect, useMetamask } from "@thirdweb-dev/react";
import { sanityClient, urlFor } from '../../sanity'
import { GetServerSideProps} from 'next'
import { Collection } from '../../typings';
import Link from 'next/link';

interface Props{ 
    collection: Collection
}

const NFTDropPage = ({collection}: Props) => {

  // Auth 
  const connectWithMetamask = useMetamask()
  const address = useAddress();
  const disconnect = useDisconnect();

  // --
  return (
    <div className="flex h-screen flex-col lg:grid lg:grid-cols-10">
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
                <p className="pt-2 text-xl text-green-500"> 13 / 21 NFT's claimed </p>
            </div>

            {/* Mint Button */}
            <button className="font-bold h-16 mt-10 bg-red-600 text-white w-full rounded-full">
                Mint NFT (0.01 ETH)
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