import { useState, useEffect, useCallback } from 'react'
import BigNumber from 'bignumber.js'
import { useWallet } from '@binance-chain/bsc-use-wallet'
import { useDispatch } from 'react-redux'
import { fetchNftsUserDataAsync } from 'state/actions'
import { approveBuyNft, approveVote, buyNft, mintNft, tradeInNft, voteNft } from 'utils/callHelpers'
import axios from 'axios'
import FormData from 'form-data'
import { useCake, useCakeForPnix, useNft, useNftMarketplace } from './useContract'
import { getAllowance } from '../utils/erc20'

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY
const PINATA_SECRET_KEY = process.env.REACT_APP_PINATA_SECRET_KEY
const API_URL = process.env.REACT_APP_API_URL

const useMint = () => {
  const dispatch = useDispatch()
  const { account } = useWallet()
  const nftContract = useNft()

  const handleMint = useCallback(
    async (file: any, name: string, artistName: string, profile: string, introduction: string) => {
      const data = new FormData()
      data.append('file', file)
      data.append('pinataMetadata', JSON.stringify({
        name: Date.now().toString()
      }))
      const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', data, {
        maxContentLength: 20000,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${data.getBoundary}`,
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY
        }
      })
      const ipfsHash = response.data.IpfsHash

      const txHash = await mintNft(nftContract, ipfsHash, account)
      const tokenId = txHash.events.Transfer.returnValues.tokenId

      const responseData = await axios.post(`${API_URL}/v1/nfts/upload`, data);

      await axios.post(`${API_URL}/v1/nfts`, {
        token_id: tokenId,
        artwork_name: name,
        artist_name: artistName,
        image: ipfsHash,
        url: responseData.data,
        profile_link: profile,
        introduction,
        owner: account,
      });

      dispatch(fetchNftsUserDataAsync(account))
    },
    [account, dispatch, nftContract],
  )

  return { onMint: handleMint }
}

export const useTradeIn = () => {
  const { account } = useWallet()
  const nftMarketplace = useNftMarketplace()

  const handleTradeIn = useCallback(async (tokenId, amount, categoryId) => {
    try {
      const tx = await tradeInNft(nftMarketplace, tokenId, amount, categoryId, account)
      await axios.patch(`${API_URL}/v1/nfts/trade/${tokenId}`, {
        price: amount,
        category_id: categoryId
      })
      return tx
    } catch (e) {
      return false
    }
  }, [nftMarketplace, account])

  return { onTradeIn: handleTradeIn }
}

export const useApproveVote = () => {
  const { account } = useWallet()
  const nftContract = useNft()
  const tokenContract = useCake()

  const handleApproveVote = useCallback(async () => {
    try {
      const tx = await approveVote(tokenContract, nftContract, account)
      return tx
    } catch (e) {
      return false
    }
  }, [tokenContract, nftContract, account])

  return { onApproveVote: handleApproveVote }
}

export const useVote = () => {
  const dispatch = useDispatch()
  const { account } = useWallet()
  const nftContract = useNft()

  const handleVoteNft = useCallback(async (tokenId, amount) => {
    try {
      const tx = await voteNft(nftContract, tokenId, amount, account)
      await axios.patch(`${API_URL}/v1/nfts/vote/${tokenId}`, {
        voteAmount: amount
      })
      return tx
    } catch {
      return false
    }
  }, [nftContract, account])

  return { onVote: handleVoteNft }
}

export const useNftVoteAllowance = () => {
  const [allowance, setAllowance] = useState(new BigNumber(0))
  const { account }: { account: string } = useWallet()
  // const lotteryContract = useLottery()
  const nftContract = useNft()
  const cakeContract = useCake()

  useEffect(() => {
    const fetchAllowance = async () => {
      const res = await getAllowance(cakeContract, nftContract, account)
      setAllowance(new BigNumber(res))
    }

    if (account && cakeContract && nftContract) {
      fetchAllowance()
    }
    const refreshInterval = setInterval(fetchAllowance, 10000)
    return () => clearInterval(refreshInterval)
  }, [account, cakeContract, nftContract])

  return allowance
}

export const useBuyNft = () => {
  const dispatch = useDispatch()
  const { account }: { account: string } = useWallet()
  const marketplaceContract = useNftMarketplace()

  const handleBuyNft = useCallback(async (categoryId, tokenId) => {
    try {
      const tx = await buyNft(marketplaceContract, categoryId, tokenId, account)
      await axios.patch(`${API_URL}/v1/nfts/buy/${tokenId}`, {
        owner: account
      })
      dispatch(fetchNftsUserDataAsync(account))
      return tx
    } catch {
      return false
    }
  }, [marketplaceContract, dispatch, account])

  return { onBuyNft: handleBuyNft }
}

export const useMarketplaceAllowance = () => {
  const [allowance, setAllowance] = useState(new BigNumber(0))
  const { account } : { account: string } = useWallet()
  const marketplaceContract = useNftMarketplace()
  // const cakeContract = useCake()
  const cakeContract = useCakeForPnix()

  useEffect(() => {
    const fetchAllowance = async () => {
      const res = await getAllowance(cakeContract, marketplaceContract, account)
      setAllowance(new BigNumber(res))
    }

    if (account && cakeContract && marketplaceContract) {
      fetchAllowance()
    }
    const refreshInterval = setInterval(fetchAllowance, 10000)
    return () => clearInterval(refreshInterval)
  }, [account, cakeContract, marketplaceContract])

  return allowance
}

export const useApproveBuyNft = () => {
  const { account } = useWallet()
  const marketplaceContract = useNftMarketplace()
  const tokenContract = useCakeForPnix()

  const handleApproveBuyNft = useCallback(async () => {
    try {
      const tx = await approveBuyNft(tokenContract, marketplaceContract, account)
      return tx
    } catch (e) {
      return false
    }
  }, [tokenContract, marketplaceContract, account])

  return { onApproveBuyNft: handleApproveBuyNft }
}


export default useMint
