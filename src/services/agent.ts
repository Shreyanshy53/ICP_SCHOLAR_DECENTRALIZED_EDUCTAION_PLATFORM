import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { Identity } from '@dfinity/identity';
import { sharedStorage } from './sharedStorage';

// Import mock declarations for development
import { canisterId as studentCanisterId, idlFactory as studentIdlFactory } from '../declarations/student_canister';
import { canisterId as courseCanisterId, idlFactory as courseIdlFactory } from '../declarations/course_canister';
import { canisterId as tokenCanisterId, idlFactory as tokenIdlFactory } from '../declarations/token_canister';
import { canisterId as peerCanisterId, idlFactory as peerIdlFactory } from '../declarations/peer_canister';

const host = 'https://ic0.app'; // Always use production host for deployed app

class AgentService {
  private agent: HttpAgent | null = null;
  private authClient: AuthClient | null = null;
  private identity: Identity | null = null;
  private studentActor: any = null;
  private courseActor: any = null;
  private tokenActor: any = null;
  private peerActor: any = null;

  async init() {
    try {
      this.authClient = await AuthClient.create({
        idleOptions: {
          disableIdle: true,
          disableDefaultIdleCallback: true
        }
      });
    } catch (error) {
      // Create a mock auth client for development
      this.authClient = {
        getIdentity: () => ({
          getPrincipal: () => ({ 
            toText: () => 'mock-principal',
            isAnonymous: () => false 
          })
        }),
        login: (options: any) => {
          setTimeout(() => options.onSuccess?.(), 100);
          return Promise.resolve();
        },
        logout: () => Promise.resolve(),
        isAuthenticated: () => Promise.resolve(true)
      } as any;
    }
    
    this.identity = this.authClient.getIdentity();
    
    try {
      this.agent = new HttpAgent({
        host,
        identity: this.identity,
      });
    } catch (error) {
      this.agent = null;
    }

    this.createActors();
  }

  private createActors() {
    // For development, use mock implementations
    this.studentActor = {
      create_student_profile: async (name: string, email: string, bio: string) => {
        const profile = {
          principal: this.identity?.getPrincipal().toText() || 'mock-principal',
          name,
          email,
          bio,
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000
        };
        
        // Store in shared storage
        sharedStorage.setStudentProfile(profile.principal, profile);
        
        return profile;
      },
      get_student_profile: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getStudentProfile(principal);
      },
      enroll_in_course: async (courseId: string) => {
        const enrollment = {
          student_id: this.identity?.getPrincipal().toText() || 'mock-principal',
          course_id: courseId,
          enrolled_at: Date.now() * 1000000,
          progress: [],
          completed: false,
          completed_at: null
        };
        
        // Store in shared storage
        sharedStorage.addEnrollment(enrollment);
        
        return enrollment;
      },
      get_student_enrollments: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getStudentEnrollments(principal);
      },
      get_student_certificates: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getStudentCertificates(principal);
      },
      mark_section_complete: async (courseId: string, sectionId: string) => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        const enrollments = sharedStorage.getStudentEnrollments(principal);
        const enrollment = enrollments.find((e: any) => e.course_id === courseId);
        
        if (enrollment) {
          // Add section to progress if not already there
          if (!enrollment.progress.includes(sectionId)) {
            const updatedProgress = [...enrollment.progress, sectionId];
            sharedStorage.updateEnrollment(principal, courseId, {
              progress: updatedProgress
            });
          }
          
          return sharedStorage.getStudentEnrollments(principal).find((e: any) => e.course_id === courseId);
        }
        
        throw new Error('Enrollment not found');
      },
      complete_course: async (courseId: string, courseTitle: string) => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        
        // Update enrollment
        sharedStorage.updateEnrollment(principal, courseId, {
          completed: true,
          completed_at: Date.now() * 1000000
        });
        
        // Get student profile for certificate
        const studentProfile = sharedStorage.getStudentProfile(principal);
        const studentName = studentProfile?.name || 'Student';
        
        // Create certificate
        const certificate = {
          certificate_id: Math.random().toString(36).substr(2, 9),
          student_id: principal,
          course_id: courseId,
          course_title: courseTitle,
          completion_date: Date.now() * 1000000,
          student_name: studentName
        };
        
        // Store certificate
        sharedStorage.addCertificate(certificate);
        
        return certificate;
      }
    };

    this.courseActor = {
      create_educator_profile: async (name: string, bio: string, expertise: string[]) => {
        const profile = {
          principal: this.identity?.getPrincipal().toText() || 'mock-principal',
          name,
          bio,
          expertise,
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000
        };
        
        // Store in shared storage
        sharedStorage.setEducatorProfile(profile.principal, profile);
        
        return profile;
      },
      get_educator_profile: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getEducatorProfile(principal);
      },
      create_course: async (title: string, description: string, token_reward: number) => {
        const course = {
          id: Math.random().toString(36).substr(2, 9),
          title,
          description,
          educator_id: this.identity?.getPrincipal().toText() || 'mock-educator',
          sections: [],
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000,
          published: false,
          token_reward
        };
        
        // Store in shared storage
        sharedStorage.addCourse(course);
        
        return course;
      },
      get_educator_courses: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getEducatorCourses(principal);
      },
      get_published_courses: async () => {
        // Default courses that are always available
        const defaultCourses = [
            {
              id: "course1",
              title: "Introduction to Blockchain",
              description: "Master the fundamentals of blockchain technology, cryptocurrency, and distributed systems. Learn from IIT Bombay's top professors.",
              educator_id: "prof-rajesh-kumar",
              educator_name: "Prof. Rajesh Kumar",
              institution: "IIT Bombay - Computer Science & Engineering",
              difficulty: "Beginner",
              duration: "6 weeks",
              rating: 4.8,
              enrolled_count: 1247,
              sections: [
                {
                  id: "intro-blockchain",
                  title: "What is Blockchain?",
                  content: `Welcome to the fascinating world of blockchain technology!

## Understanding Blockchain

Blockchain is a revolutionary technology that serves as a distributed ledger, maintaining a continuously growing list of records (blocks) that are linked and secured using cryptography. Think of it as a digital ledger that's shared across multiple computers, making it nearly impossible to hack or manipulate.

### Key Characteristics:

1. **Decentralization**: No single point of control
2. **Transparency**: All transactions are visible to network participants
3. **Immutability**: Once data is recorded, it's extremely difficult to change
4. **Security**: Cryptographic hashing ensures data integrity

### Real-World Applications:

- **Cryptocurrency**: Bitcoin, Ethereum, and other digital currencies
- **Supply Chain**: Tracking products from manufacture to consumer
- **Healthcare**: Secure patient record management
- **Voting Systems**: Transparent and tamper-proof elections
- **Real Estate**: Property ownership and transfer records

### How Blockchain Works:

1. **Transaction Initiation**: A user initiates a transaction
2. **Broadcasting**: The transaction is broadcast to the network
3. **Validation**: Network nodes validate the transaction
4. **Block Creation**: Valid transactions are bundled into a block
5. **Consensus**: The network agrees on the new block
6. **Addition**: The block is added to the chain

This process ensures that every transaction is verified by multiple parties, creating a trustless system where participants don't need to know or trust each other.

### Why Blockchain Matters:

Blockchain technology addresses fundamental issues in digital transactions:
- **Double Spending**: Prevents the same digital asset from being spent twice
- **Trust**: Eliminates the need for intermediaries
- **Censorship Resistance**: No single entity can block transactions
- **Global Access**: Available 24/7 worldwide

In the next section, we'll dive deeper into the cryptographic foundations that make blockchain secure and reliable.`,
                  order: 0
                },
                {
                  id: "crypto-foundations",
                  title: "Cryptographic Foundations",
                  content: `Understanding the cryptographic principles that secure blockchain networks.

## Hash Functions

Hash functions are mathematical algorithms that convert input data of any size into a fixed-size string of characters. In blockchain, we primarily use SHA-256 (Secure Hash Algorithm 256-bit).

### Properties of Cryptographic Hash Functions:

1. **Deterministic**: Same input always produces same output
2. **Fixed Output Size**: Always 256 bits for SHA-256
3. **Avalanche Effect**: Small input change drastically changes output
4. **One-Way Function**: Computationally infeasible to reverse
5. **Collision Resistant**: Nearly impossible to find two inputs with same output

### Example:
Input: "Hello, Blockchain!"
SHA-256 Output: 7d865e959b2466918c9863afca942d0fb89d7c9ac0c99bafc3749504ded97730

Input: "Hello, Blockchain?"
SHA-256 Output: 8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4

Notice how changing just one character completely changes the hash!

## Digital Signatures

Digital signatures provide authentication and non-repudiation in blockchain transactions.

### How Digital Signatures Work:

1. **Key Generation**: Create a public-private key pair
2. **Signing**: Use private key to sign transaction data
3. **Verification**: Others use public key to verify signature

### Benefits:
- **Authentication**: Proves who sent the transaction
- **Integrity**: Ensures data hasn't been tampered with
- **Non-repudiation**: Sender can't deny sending the transaction

## Merkle Trees

Merkle trees efficiently summarize all transactions in a block using a binary tree structure.

### Structure:
- **Leaf Nodes**: Individual transaction hashes
- **Internal Nodes**: Hash of two child nodes
- **Root**: Single hash representing entire block

### Advantages:
- **Efficient Verification**: Verify any transaction with log(n) hashes
- **Tamper Detection**: Any change invalidates the root hash
- **Scalability**: Handle millions of transactions efficiently

These cryptographic tools work together to create the security foundation that makes blockchain technology trustworthy and reliable.`,
                  order: 1
                },
                {
                  id: "consensus-mechanisms",
                  title: "Consensus Mechanisms",
                  content: `Learn how blockchain networks reach agreement without central authority.

## What is Consensus?

Consensus mechanisms are protocols that ensure all nodes in a blockchain network agree on the current state of the ledger. They solve the fundamental problem of achieving agreement in a distributed system.

## Proof of Work (PoW)

Used by Bitcoin and Ethereum (until 2022), PoW requires miners to solve computationally expensive puzzles.

### How PoW Works:

1. **Transaction Collection**: Miners gather pending transactions
2. **Block Creation**: Form a candidate block with transactions
3. **Puzzle Solving**: Find a nonce that makes block hash meet difficulty target
4. **Broadcasting**: Share the solution with the network
5. **Verification**: Other nodes verify and accept the block

### Advantages:
- **Security**: Extremely secure due to computational cost
- **Decentralization**: Anyone can participate as a miner
- **Proven Track Record**: Successfully securing Bitcoin since 2009

### Disadvantages:
- **Energy Consumption**: Requires massive computational power
- **Scalability**: Limited transaction throughput
- **Environmental Impact**: High electricity usage

## Proof of Stake (PoS)

Validators are chosen to create blocks based on their stake (ownership) in the network.

### How PoS Works:

1. **Staking**: Validators lock up tokens as collateral
2. **Selection**: Algorithm chooses validator based on stake and randomness
3. **Block Proposal**: Selected validator creates new block
4. **Attestation**: Other validators vote on the block's validity
5. **Finalization**: Block is added if it receives enough votes

### Advantages:
- **Energy Efficient**: No computational puzzles to solve
- **Scalability**: Faster transaction processing
- **Economic Security**: Validators lose stake for malicious behavior

### Disadvantages:
- **Wealth Concentration**: Rich validators get richer
- **Nothing at Stake**: Theoretical attack vector
- **Complexity**: More complex protocol design

## Other Consensus Mechanisms

### Delegated Proof of Stake (DPoS)
- Token holders vote for delegates who validate transactions
- Faster and more scalable than traditional PoS
- Used by EOS and Tron

### Proof of Authority (PoA)
- Pre-approved validators with known identities
- High performance and energy efficient
- Suitable for private and consortium blockchains

### Practical Byzantine Fault Tolerance (pBFT)
- Handles up to 1/3 malicious nodes
- Immediate finality
- Used in permissioned networks

## Choosing the Right Consensus

The choice of consensus mechanism depends on:
- **Security Requirements**: How much security is needed?
- **Scalability Needs**: How many transactions per second?
- **Decentralization Goals**: How distributed should the network be?
- **Energy Constraints**: What's the acceptable energy consumption?
- **Governance Model**: Who should control the network?

Understanding consensus mechanisms is crucial for evaluating different blockchain platforms and their trade-offs.`,
                  order: 2
                }
              ],
              created_at: Date.now() * 1000000,
              updated_at: Date.now() * 1000000,
              published: true,
              token_reward: 50
            },
            {
              id: "course2",
              title: "Smart Contracts & DApp Development",
              description: "Master smart contract development and build decentralized applications. Learn Solidity, Web3.js, and modern DApp architecture patterns.",
              educator_id: "dr-priya-sharma",
              educator_name: "Dr. Priya Sharma",
              institution: "IIT Delhi - Computer Science & Engineering",
              difficulty: "Intermediate",
              duration: "8 weeks",
              rating: 4.9,
              enrolled_count: 892,
              sections: [
                {
                  id: "smart-contract-basics",
                  title: "Smart Contract Basics",
                  content: `Introduction to smart contracts and their revolutionary potential.

## What are Smart Contracts?

Smart contracts are self-executing contracts with terms directly written into code. They automatically execute when predetermined conditions are met, eliminating the need for intermediaries.

### Key Characteristics:

1. **Autonomous**: Execute automatically without human intervention
2. **Transparent**: Code is visible on the blockchain
3. **Immutable**: Cannot be changed once deployed (unless designed with upgrade mechanisms)
4. **Deterministic**: Same inputs always produce same outputs
5. **Distributed**: Executed across multiple nodes

### Benefits:

- **Trust**: No need to trust counterparties
- **Cost Reduction**: Eliminate intermediaries and their fees
- **Speed**: Instant execution when conditions are met
- **Accuracy**: Reduce human error in contract execution
- **Transparency**: All parties can verify contract terms

### Use Cases:

- **Insurance**: Automated claim processing
- **Supply Chain**: Automatic payments upon delivery
- **Real Estate**: Escrow and title transfers
- **Finance**: Lending, borrowing, and trading protocols
- **Gaming**: In-game asset ownership and trading

Understanding these fundamentals is crucial before diving into actual smart contract development.`,
                  order: 0
                },
                {
                  id: "solidity-programming",
                  title: "Solidity Programming Language",
                  content: `Master Solidity, the primary language for Ethereum smart contracts.

## Solidity Basics

Solidity is a statically-typed programming language designed for developing smart contracts on Ethereum.

### Basic Syntax:

\`\`\`solidity
pragma solidity ^0.8.0;

contract HelloWorld {
    string public message;
    
    constructor(string memory _message) {
        message = _message;
    }
    
    function updateMessage(string memory _newMessage) public {
        message = _newMessage;
    }
}
\`\`\`

### Data Types:

- **Boolean**: \`bool\`
- **Integers**: \`uint256\`, \`int256\`
- **Address**: \`address\`
- **Bytes**: \`bytes32\`
- **String**: \`string\`
- **Arrays**: \`uint[]\`
- **Mappings**: \`mapping(address => uint)\`

### Functions and Visibility:

- **public**: Accessible from anywhere
- **private**: Only within the contract
- **internal**: Within contract and derived contracts
- **external**: Only from outside the contract

### State Variables:

Variables stored permanently on the blockchain.

\`\`\`solidity
contract Storage {
    uint256 public storedData;
    
    function set(uint256 x) public {
        storedData = x;
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }
}
\`\`\`

Understanding these fundamentals is essential for smart contract development.`,
                  order: 1
                }
              ],
              created_at: Date.now() * 1000000,
              updated_at: Date.now() * 1000000,
              published: true,
              token_reward: 75
            },
            {
              id: "course3",
              title: "DeFi Protocols & Yield Farming",
              description: "Deep dive into Decentralized Finance protocols, liquidity mining, and yield farming strategies. Learn to build and analyze DeFi applications.",
              educator_id: "prof-arjun-menon",
              educator_name: "Prof. Arjun Menon",
              institution: "IIT Madras - Financial Technology",
              difficulty: "Advanced",
              duration: "10 weeks",
              rating: 4.9,
              enrolled_count: 634,
              sections: [
                {
                  id: "defi-intro",
                  title: "Introduction to DeFi",
                  content: `Welcome to the world of Decentralized Finance!

## What is DeFi?

Decentralized Finance (DeFi) represents a paradigm shift from traditional, centralized financial systems to peer-to-peer finance enabled by decentralized technologies built on blockchain networks.

### Core Principles of DeFi:

1. **Permissionless**: Anyone can access DeFi protocols without approval
2. **Transparent**: All transactions are visible on the blockchain
3. **Programmable**: Smart contracts automate financial operations
4. **Composable**: DeFi protocols can be combined like "money legos"
5. **Global**: Accessible 24/7 from anywhere in the world

### Key DeFi Categories:

- **Lending & Borrowing**: Aave, Compound, MakerDAO
- **Decentralized Exchanges**: Uniswap, SushiSwap, Curve
- **Derivatives**: Synthetix, dYdX, Perpetual Protocol
- **Insurance**: Nexus Mutual, Cover Protocol
- **Asset Management**: Yearn Finance, Balancer

### Total Value Locked (TVL)

TVL represents the total amount of assets locked in DeFi protocols. As of 2024, the DeFi ecosystem has grown to over $100 billion in TVL, demonstrating massive adoption and trust in these protocols.

### Benefits of DeFi:

- **Higher Yields**: Often better returns than traditional finance
- **24/7 Access**: Markets never close
- **No Intermediaries**: Direct peer-to-peer transactions
- **Innovation**: Rapid development of new financial products
- **Financial Inclusion**: Access for the unbanked

### Risks to Consider:

- **Smart Contract Risk**: Code vulnerabilities
- **Impermanent Loss**: For liquidity providers
- **Regulatory Uncertainty**: Evolving legal landscape
- **Market Volatility**: High price fluctuations

In the next section, we'll explore automated market makers and how they revolutionize trading.`,
                  order: 0
                },
                {
                  id: "amm-protocols",
                  title: "Automated Market Makers (AMMs)",
                  content: `Understanding the revolutionary trading mechanism that powers DeFi.

## Automated Market Makers Explained

AMMs are smart contracts that create liquidity pools for trading cryptocurrencies without traditional order books. Instead of matching buyers and sellers, AMMs use mathematical formulas to price assets.

### How AMMs Work:

1. **Liquidity Pools**: Users deposit token pairs (e.g., ETH/USDC)
2. **Constant Product Formula**: x * y = k (Uniswap V2)
3. **Price Discovery**: Prices adjust based on pool ratios
4. **Arbitrage**: Keeps prices aligned with external markets

### Popular AMM Protocols:

**Uniswap V3**
- Concentrated liquidity
- Capital efficiency improvements
- Fee tiers (0.05%, 0.3%, 1%)

**Curve Finance**
- Optimized for stablecoin trading
- Low slippage for similar assets
- Governance token (CRV) rewards

**Balancer**
- Multi-token pools (up to 8 tokens)
- Weighted pools and stable pools
- Programmable liquidity

### Liquidity Provider Economics:

**Rewards:**
- Trading fees (typically 0.3%)
- Liquidity mining rewards
- Governance token incentives

**Risks:**
- Impermanent loss
- Smart contract risk
- Token price volatility

### Impermanent Loss Calculation:

When you provide liquidity to a 50/50 pool and one token appreciates significantly, you experience impermanent loss compared to just holding the tokens.

Formula: IL = 2 * sqrt(price_ratio) / (1 + price_ratio) - 1

Understanding AMMs is crucial for participating in DeFi yield farming strategies.`,
                  order: 1
                },
                {
                  id: "yield-farming",
                  title: "Yield Farming Strategies",
                  content: `Master advanced yield farming techniques and risk management.

## Yield Farming Fundamentals

Yield farming involves strategically moving crypto assets between different DeFi protocols to maximize returns. It's like being a farmer, but instead of crops, you're harvesting yield from your crypto assets.

### Basic Yield Farming Strategies:

**1. Liquidity Mining**
- Provide liquidity to DEX pools
- Earn trading fees + governance tokens
- Example: Provide ETH/USDC on Uniswap, earn UNI tokens

**2. Lending & Borrowing**
- Lend assets on Aave/Compound
- Borrow against collateral
- Farm governance tokens (AAVE, COMP)

**3. Staking Derivatives**
- Stake ETH for stETH (Lido)
- Use stETH as collateral
- Maintain ETH exposure while earning yield

### Advanced Strategies:

**Leveraged Yield Farming**
1. Deposit USDC as collateral
2. Borrow more USDC (up to 75% LTV)
3. Provide liquidity with borrowed funds
4. Amplify rewards but increase risk

**Delta-Neutral Farming**
1. Long spot position
2. Short perpetual futures
3. Earn yield while hedging price risk
4. Focus purely on farming rewards

**Convex Strategy (for Curve)**
1. Deposit LP tokens in Convex
2. Earn boosted CRV rewards
3. Receive CVX tokens as bonus
4. Compound rewards automatically

### Risk Management:

**Position Sizing**
- Never risk more than you can afford to lose
- Diversify across multiple protocols
- Start small and scale gradually

**Smart Contract Audits**
- Check protocol audit history
- Understand code risks
- Monitor TVL and usage metrics

**Liquidation Management**
- Maintain healthy collateral ratios
- Set up monitoring alerts
- Have exit strategies ready

### Yield Farming Tools:

- **DeFi Pulse**: Track protocol TVL
- **Zapper**: Portfolio management
- **DeBank**: Yield tracking
- **APY.vision**: Impermanent loss tracking

Remember: High yields often come with high risks. Always DYOR (Do Your Own Research)!`,
                  order: 2
                }
              ],
              created_at: Date.now() * 1000000,
              updated_at: Date.now() * 1000000,
              published: true,
              token_reward: 100
            },
            {
              id: "course4",
              title: "NFT Development & Marketplace Creation",
              description: "Learn to create, deploy, and trade NFTs. Build your own NFT marketplace from scratch using modern Web3 technologies.",
              educator_id: "dr-vikram-singh",
              educator_name: "Dr. Vikram Singh",
              institution: "IIT Kanpur - Digital Arts & Technology",
              difficulty: "Intermediate",
              duration: "7 weeks",
              rating: 4.7,
              enrolled_count: 789,
              sections: [
                {
                  id: "nft-fundamentals",
                  title: "NFT Fundamentals & Standards",
                  content: `Understanding Non-Fungible Tokens and their revolutionary impact.

## What are NFTs?

Non-Fungible Tokens (NFTs) are unique digital assets that represent ownership of specific items or content on the blockchain. Unlike cryptocurrencies, each NFT is distinct and cannot be exchanged on a one-to-one basis.

### Key Characteristics:

1. **Uniqueness**: Each NFT has a unique identifier
2. **Indivisibility**: Cannot be divided into smaller units
3. **Ownership**: Verifiable ownership on blockchain
4. **Transferability**: Can be bought, sold, and traded
5. **Programmability**: Smart contract functionality

### NFT Standards:

**ERC-721 (Ethereum)**
- First NFT standard
- One token per contract call
- Individual ownership tracking
- Used by CryptoPunks, Bored Apes

**ERC-1155 (Multi-Token)**
- Batch operations
- Fungible and non-fungible in one contract
- Gas efficient for gaming
- Used by OpenSea, Enjin

**ERC-998 (Composable)**
- NFTs that own other NFTs
- Hierarchical ownership
- Complex digital assets

### NFT Use Cases:

**Digital Art**
- Unique artwork ownership
- Artist royalties on resales
- Provenance tracking

**Gaming**
- In-game items and characters
- Cross-game compatibility
- Player-owned economies

**Music & Entertainment**
- Album releases
- Concert tickets
- Fan engagement

**Real Estate**
- Virtual land ownership
- Property documentation
- Fractional ownership

**Identity & Credentials**
- Digital certificates
- Academic degrees
- Professional licenses

### NFT Metadata Structure:

\`\`\`json
{
  "name": "My Awesome NFT",
  "description": "This is a unique digital artwork",
  "image": "https://ipfs.io/ipfs/QmHash...",
  "attributes": [
    {
      "trait_type": "Color",
      "value": "Blue"
    },
    {
      "trait_type": "Rarity",
      "value": "Legendary"
    }
  ]
}
\`\`\`

Understanding these fundamentals is crucial before diving into NFT development and marketplace creation.`,
                  order: 0
                },
                {
                  id: "nft-smart-contracts",
                  title: "Creating NFT Smart Contracts",
                  content: `Learn to develop and deploy your own NFT smart contracts.

## NFT Smart Contract Development

Creating NFT smart contracts involves understanding the ERC-721 standard and implementing the required functions for minting, transferring, and managing tokens.

### Basic ERC-721 Implementation:

\`\`\`solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract MyNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    
    mapping(uint256 => string) private _tokenURIs;
    
    constructor() ERC721("MyNFT", "MNFT") {}
    
    function mintNFT(address recipient, string memory tokenURI)
        public onlyOwner returns (uint256)
    {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(recipient, newItemId);
        _setTokenURI(newItemId, tokenURI);
        return newItemId;
    }
    
    function _setTokenURI(uint256 tokenId, string memory _tokenURI)
        internal virtual
    {
        require(_exists(tokenId), "URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }
    
    function tokenURI(uint256 tokenId)
        public view virtual override returns (string memory)
    {
        require(_exists(tokenId), "URI query for nonexistent token");
        return _tokenURIs[tokenId];
    }
}
\`\`\`

### Advanced Features:

**Royalties (EIP-2981)**
\`\`\`solidity
function royaltyInfo(uint256 tokenId, uint256 salePrice)
    external view returns (address receiver, uint256 royaltyAmount)
{
    return (owner(), (salePrice * 250) / 10000); // 2.5% royalty
}
\`\`\`

**Batch Minting**
\`\`\`solidity
function batchMint(address[] memory recipients, string[] memory tokenURIs)
    public onlyOwner
{
    require(recipients.length == tokenURIs.length, "Arrays length mismatch");
    
    for (uint256 i = 0; i < recipients.length; i++) {
        mintNFT(recipients[i], tokenURIs[i]);
    }
}
\`\`\`

**Reveal Mechanism**
\`\`\`solidity
bool public revealed = false;
string public notRevealedUri;

function reveal() public onlyOwner {
    revealed = true;
}

function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
    if (!revealed) {
        return notRevealedUri;
    }
    return _tokenURIs[tokenId];
}
\`\`\`

### Gas Optimization Tips:

1. **Use ERC721A for batch minting**
2. **Pack struct variables efficiently**
3. **Use events for off-chain data**
4. **Implement lazy minting**
5. **Consider Layer 2 solutions**

### Testing Your Contract:

\`\`\`javascript
const { expect } = require("chai");

describe("MyNFT", function () {
  it("Should mint and assign token to owner", async function () {
    const [owner] = await ethers.getSigners();
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const myNFT = await MyNFT.deploy();
    
    await myNFT.mintNFT(owner.address, "https://example.com/token/1");
    expect(await myNFT.ownerOf(1)).to.equal(owner.address);
  });
});
\`\`\`

Next, we'll learn how to build a complete NFT marketplace!`,
                  order: 1
                }
              ],
              created_at: Date.now() * 1000000,
              updated_at: Date.now() * 1000000,
              published: true,
              token_reward: 85
            },
            {
              id: "course5",
              title: "Web3 Security & Smart Contract Auditing",
              description: "Master blockchain security principles and learn to audit smart contracts. Understand common vulnerabilities and how to prevent them.",
              educator_id: "prof-anita-desai",
              educator_name: "Prof. Anita Desai",
              institution: "IIT Guwahati - Cybersecurity",
              difficulty: "Advanced",
              duration: "12 weeks",
              rating: 4.9,
              enrolled_count: 456,
              sections: [
                {
                  id: "security-fundamentals",
                  title: "Blockchain Security Fundamentals",
                  content: `Understanding the security landscape in blockchain and Web3.

## Web3 Security Overview

Blockchain security involves multiple layers, from the underlying protocol to smart contracts and user interfaces. Understanding these layers is crucial for building secure decentralized applications.

### Security Layers:

1. **Protocol Layer**: Consensus mechanisms, network security
2. **Smart Contract Layer**: Code vulnerabilities, logic flaws
3. **Application Layer**: Frontend security, wallet integration
4. **User Layer**: Private key management, social engineering

### Common Attack Vectors:

**Smart Contract Vulnerabilities**
- Reentrancy attacks
- Integer overflow/underflow
- Access control issues
- Front-running
- Flash loan attacks

**Protocol Attacks**
- 51% attacks
- Eclipse attacks
- Sybil attacks
- Long-range attacks

**Application Attacks**
- Cross-site scripting (XSS)
- Man-in-the-middle attacks
- Phishing attacks
- Fake DApps

### The DAO Hack (2016)

The most famous smart contract exploit that led to Ethereum's hard fork:

**Vulnerability**: Reentrancy in the withdrawal function
**Impact**: $60 million drained
**Lesson**: Always follow checks-effects-interactions pattern

\`\`\`solidity
// Vulnerable code
function withdraw(uint amount) public {
    require(balances[msg.sender] >= amount);
    msg.sender.call.value(amount)(); // External call before state change
    balances[msg.sender] -= amount; // State change after external call
}

// Secure code
function withdraw(uint amount) public {
    require(balances[msg.sender] >= amount);
    balances[msg.sender] -= amount; // State change first
    msg.sender.call.value(amount)(); // External call last
}
\`\`\`

### Security Best Practices:

**Development**
- Use established libraries (OpenZeppelin)
- Follow security patterns
- Implement proper access controls
- Use reentrancy guards

**Testing**
- Comprehensive unit tests
- Integration testing
- Fuzzing and property testing
- Formal verification

**Deployment**
- Professional audits
- Bug bounty programs
- Gradual rollouts
- Emergency pause mechanisms

### Security Tools:

**Static Analysis**
- Slither
- Mythril
- Securify
- SmartCheck

**Dynamic Analysis**
- Echidna (fuzzing)
- Manticore (symbolic execution)
- Scribble (runtime verification)

**Formal Verification**
- Certora
- KEVM
- Dafny

Security is not optional in Web3 - it's fundamental to building trust and protecting user funds.`,
                  order: 0
                },
                {
                  id: "common-vulnerabilities",
                  title: "Common Smart Contract Vulnerabilities",
                  content: `Deep dive into the most common smart contract vulnerabilities and how to prevent them.

## Top 10 Smart Contract Vulnerabilities

Understanding these vulnerabilities is crucial for any smart contract developer or auditor.

### 1. Reentrancy

**Description**: External calls can call back into the contract before the first execution is complete.

**Example**:
\`\`\`solidity
// Vulnerable
function withdraw() external {
    uint amount = balances[msg.sender];
    (bool success,) = msg.sender.call{value: amount}("");
    require(success);
    balances[msg.sender] = 0; // Too late!
}

// Secure
function withdraw() external nonReentrant {
    uint amount = balances[msg.sender];
    balances[msg.sender] = 0; // Update state first
    (bool success,) = msg.sender.call{value: amount}("");
    require(success);
}
\`\`\`

### 2. Integer Overflow/Underflow

**Description**: Arithmetic operations that exceed variable limits.

**Example**:
\`\`\`solidity
// Vulnerable (Solidity < 0.8.0)
function add(uint256 a, uint256 b) public pure returns (uint256) {
    return a + b; // Can overflow
}

// Secure
function add(uint256 a, uint256 b) public pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a, "Addition overflow");
    return c;
}

// Or use SafeMath library
using SafeMath for uint256;
function add(uint256 a, uint256 b) public pure returns (uint256) {
    return a.add(b);
}
\`\`\`

### 3. Access Control Issues

**Description**: Functions that should be restricted are accessible to unauthorized users.

**Example**:
\`\`\`solidity
// Vulnerable
function withdraw() public {
    // Anyone can call this!
    payable(owner).transfer(address(this).balance);
}

// Secure
modifier onlyOwner() {
    require(msg.sender == owner, "Not the owner");
    _;
}

function withdraw() public onlyOwner {
    payable(owner).transfer(address(this).balance);
}
\`\`\`

### 4. Front-Running

**Description**: Miners or bots can see pending transactions and submit their own with higher gas fees.

**Mitigation**:
- Commit-reveal schemes
- Batch auctions
- Private mempools
- Time delays

### 5. Flash Loan Attacks

**Description**: Exploiting price oracles or governance using borrowed funds within a single transaction.

**Prevention**:
- Use time-weighted average prices (TWAP)
- Multiple oracle sources
- Circuit breakers
- Governance delays

### 6. Denial of Service (DoS)

**Description**: Making contracts unusable through gas limit attacks or external dependencies.

**Example**:
\`\`\`solidity
// Vulnerable - gas limit DoS
function refundAll() public {
    for (uint i = 0; i < investors.length; i++) {
        investors[i].transfer(amounts[i]); // Can run out of gas
    }
}

// Secure - pull over push
function withdraw() public {
    uint amount = amounts[msg.sender];
    amounts[msg.sender] = 0;
    payable(msg.sender).transfer(amount);
}
\`\`\`

### 7. Timestamp Dependence

**Description**: Relying on block.timestamp for critical logic.

**Issue**: Miners can manipulate timestamps within ~15 seconds.

**Solution**: Use block numbers or external time sources for critical operations.

### 8. Unchecked External Calls

**Description**: Not checking return values of external calls.

**Example**:
\`\`\`solidity
// Vulnerable
token.transfer(recipient, amount); // Ignores return value

// Secure
require(token.transfer(recipient, amount), "Transfer failed");

// Or use SafeERC20
using SafeERC20 for IERC20;
token.safeTransfer(recipient, amount);
\`\`\`

### 9. Delegate Call Vulnerabilities

**Description**: Incorrect use of delegatecall can lead to storage collisions.

**Risk**: The called contract executes in the caller's context.

### 10. Randomness Vulnerabilities

**Description**: Using predictable sources for randomness.

**Bad**:
\`\`\`solidity
uint random = uint(keccak256(abi.encodePacked(block.timestamp, block.difficulty)));
\`\`\`

**Better**: Use Chainlink VRF or commit-reveal schemes.

### Audit Checklist:

- [ ] Reentrancy protection
- [ ] Integer overflow/underflow checks
- [ ] Access control implementation
- [ ] External call return value checks
- [ ] Gas limit considerations
- [ ] Oracle manipulation resistance
- [ ] Proper randomness implementation
- [ ] Emergency pause mechanisms
- [ ] Upgrade safety (if applicable)
- [ ] Documentation and comments

Remember: Security is an ongoing process, not a one-time check!`,
                  order: 1
                }
              ],
              created_at: Date.now() * 1000000,
              updated_at: Date.now() * 1000000,
              published: true,
              token_reward: 120
            }
        ];
        
        // Get user-created published courses from shared storage
        const userCreatedCourses = sharedStorage.getPublishedCourses();
        
        // Combine default courses with user-created courses, avoiding duplicates
        const allCourses = [...defaultCourses];
        userCreatedCourses.forEach(course => {
          if (!allCourses.find(c => c.id === course.id)) {
            allCourses.push(course);
          }
        });
        
        console.log('Total published courses:', allCourses.length);
        return allCourses;
      },
      get_course: async (id: string) => {
        // Get all courses (default + user-created)
        const allCourses = await this.courseActor.get_published_courses();
        const course = allCourses.find((c: any) => c.id === id);
        
        if (course) {
          console.log('Found course:', course.title);
          return course;
        }
        
        console.log('Course not found:', id);
        return null;
      },
      add_course_section: async (course_id: string, title: string, content: string) => {
        const course = sharedStorage.getCourse(course_id);
        
        if (course) {
          const newSection = {
            id: Math.random().toString(36).substr(2, 9),
            title,
            content,
            order: course.sections.length
          };
          
          const updatedSections = [...course.sections, newSection];
          sharedStorage.updateCourse(course_id, {
            sections: updatedSections,
            updated_at: Date.now() * 1000000
          });
          
          return sharedStorage.getCourse(course_id);
        }
        
        throw new Error('Course not found');
      },
      publish_course: async (course_id: string) => {
        const course = sharedStorage.getCourse(course_id);
        
        if (course) {
          sharedStorage.updateCourse(course_id, {
            published: true,
            updated_at: Date.now() * 1000000
          });
          
          return sharedStorage.getCourse(course_id);
        }
        
        throw new Error('Course not found');
      }
    };

    this.tokenActor = {
      get_balance: async (principal?: string) => {
        const owner = principal || this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getTokenBalance(owner);
      },
      transfer_tokens: async (to: string, amount: number, memo: string) => {
        return {
          id: Math.random().toString(36).substr(2, 9),
          from: this.identity?.getPrincipal().toText() || 'mock-sender',
          to,
          amount,
          transaction_type: 'Transfer',
          timestamp: Date.now() * 1000000,
          memo
        };
      },
      get_transaction_history: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getTransactions(principal);
      },
      reward_course_completion: async (studentId: string, amount: number, courseId: string) => {
        // Update token balance in shared storage
        const currentBalance = sharedStorage.getTokenBalance(studentId);
        const newBalance = currentBalance + amount;
        sharedStorage.setTokenBalance(studentId, newBalance);
        
        // Store transaction record in shared storage
        const transaction = {
          id: `tx_${Date.now()}`,
          from: 'system',
          to: studentId,
          amount: amount,
          timestamp: Date.now() * 1000000,
          memo: `Course completion reward: ${courseId}`
        };
        sharedStorage.addTransaction(studentId, transaction);
        
        return {
          success: true,
          transaction_id: transaction.id,
          new_balance: newBalance
        };
      }
    };

    this.peerActor = {
      create_peer_note: async (course_id: string, author_name: string, content: string, note_type: any) => {
        const note = {
          id: Math.random().toString(36).substr(2, 9),
          course_id,
          author: this.identity?.getPrincipal().toText() || 'mock-author',
          author_name,
          content,
          note_type: Object.keys(note_type)[0],
          created_at: Date.now() * 1000000,
          updated_at: Date.now() * 1000000,
          tips_received: 0
        };
        
        // Store in shared storage for global visibility
        sharedStorage.addPeerNote(note);
        
        return note;
      },
      get_user_notes: async () => {
        const principal = this.identity?.getPrincipal().toText() || 'mock-principal';
        return sharedStorage.getUserNotes(principal);
      },
      get_course_notes: async (course_id: string) => {
        return sharedStorage.getCourseNotes(course_id);
      },
      get_all_notes: async () => {
        return sharedStorage.getPeerNotes();
      },
      tip_peer_note: async (note_id: string, amount: number, message: string) => {
        // Find and update the note in shared storage
        const notes = sharedStorage.getPeerNotes();
        const note = notes.find((n: any) => n.id === note_id);
        
        if (note) {
          sharedStorage.updatePeerNote(note_id, {
            tips_received: note.tips_received + amount
          });
        }
        
        return {
          id: Math.random().toString(36).substr(2, 9),
          note_id,
          tipper: this.identity?.getPrincipal().toText() || 'mock-tipper',
          recipient: note?.author || 'mock-recipient',
          amount,
          timestamp: Date.now() * 1000000,
          message
        };
      }
    };
  }

  async login() {
    if (!this.authClient) return false;

    return new Promise<boolean>((resolve) => {
      this.authClient!.login({
        identityProvider: 'https://identity.ic0.app',
        onSuccess: () => {
          this.identity = this.authClient!.getIdentity();
          this.agent = new HttpAgent({
            host,
            identity: this.identity,
          });
          this.createActors();
          resolve(true);
        },
        onError: () => resolve(false),
      });
    });
  }

  async logout() {
    if (!this.authClient) return;
    await this.authClient.logout();
    this.identity = null;
    this.agent = null;
    this.studentActor = null;
    this.courseActor = null;
    this.tokenActor = null;
    this.peerActor = null;
  }

  isAuthenticated(): boolean {
    return this.identity !== null && !this.identity.getPrincipal().isAnonymous();
  }

  getPrincipal() {
    return this.identity?.getPrincipal();
  }

  // Actor getters
  get student() {
    return this.studentActor;
  }

  get course() {
    return this.courseActor;
  }

  get token() {
    return this.tokenActor;
  }

  get peer() {
    return this.peerActor;
  }

  // Enhanced method to complete course with proper token rewards
  async completeCourseWithRewards(courseId: string, courseTitle: string, tokenReward: number): Promise<any> {
    if (!this.studentActor || !this.tokenActor || !this.identity) {
      throw new Error('Services not initialized');
    }

    try {
      console.log('Starting course completion process...');
      
      // 1. Complete the course in student canister
      const certificate = await this.studentActor.complete_course(courseId, courseTitle);
      console.log('Course completed, certificate generated:', certificate);
      
      // 2. Award tokens to the student
      const principal = this.identity.getPrincipal().toText();
      const tokenResult = await this.tokenActor.reward_course_completion(
        principal,
        tokenReward,
        courseId
      );
      console.log('Tokens awarded:', tokenResult);

      // 3. Force refresh token balance in UI
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('tokenBalanceUpdate'));
      }, 100);

      // 3. Return certificate for PDF generation
      return certificate;
    } catch (error) {
      console.error('Error completing course with rewards:', error);
      throw error;
    }
  }

  // Method to get current token balance
  async getTokenBalance(): Promise<number> {
    if (!this.tokenActor || !this.identity) {
      console.log('Token actor or identity not available, returning default balance');
      return 100; // Default balance
    }

    try {
      const principal = this.identity.getPrincipal().toText();
      console.log('Getting token balance for principal:', principal);
      const balance = await this.tokenActor.get_balance(principal);
      console.log('Token balance retrieved:', balance);
      return balance;
    } catch (error) {
      console.error('Error getting token balance:', error);
      return 100; // Return default on error
    }
  }

  // Method to refresh token balance
  async refreshTokenBalance(): Promise<number> {
    return await this.getTokenBalance();
  }
}

export const agentService = new AgentService();